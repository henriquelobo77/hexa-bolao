"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseAdmin } from "../supabase";
import { setMemberId, clearMemberId, getMemberId } from "../session";
import { getBolaoByCode, getMember } from "../queries";

// ============================================================
// Entrar no bolão (cria/recupera membro, seta cookie)
// ============================================================

const joinSchema = z.object({
  code: z.string().min(3).max(32),
  nickname: z.string().min(1).max(24).trim(),
});

export type JoinResult =
  | { ok: true; bolaoSlug: string }
  | { ok: false; error: string };

export async function joinBolao(formData: FormData): Promise<JoinResult> {
  const parsed = joinSchema.safeParse({
    code: formData.get("code"),
    nickname: formData.get("nickname"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Código e apelido são obrigatórios." };
  }
  const { code, nickname } = parsed.data;

  const bolao = await getBolaoByCode(code);
  if (!bolao) {
    return { ok: false, error: "Código do bolão não encontrado." };
  }

  const admin = supabaseAdmin();

  // Tenta achar membro com mesmo apelido nesse bolão (case-insensitive)
  const { data: existing } = await admin
    .from("members")
    .select("id")
    .eq("bolao_id", bolao.id)
    .ilike("nickname", nickname)
    .maybeSingle<{ id: string }>();

  let memberId: string;
  if (existing) {
    memberId = existing.id;
    await admin.from("members")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", memberId);
  } else {
    // Antes de criar, valida cap de membros (se configurado)
    if (bolao.max_members != null) {
      const { count } = await admin
        .from("members")
        .select("*", { count: "exact", head: true })
        .eq("bolao_id", bolao.id);
      if ((count ?? 0) >= bolao.max_members) {
        return { ok: false, error: "Bolão lotado. Fala com o admin." };
      }
    }
    const { data: created, error } = await admin
      .from("members")
      .insert({ bolao_id: bolao.id, nickname })
      .select("id")
      .single<{ id: string }>();
    if (error || !created) {
      console.error("[joinBolao]", error);
      return { ok: false, error: "Não consegui te cadastrar. Tenta de novo." };
    }
    memberId = created.id;
  }

  await setMemberId(memberId);
  revalidatePath("/", "layout");
  return { ok: true, bolaoSlug: bolao.slug };
}

// ============================================================
// Sair do bolão (limpa cookie)
// ============================================================

export async function leaveBolao() {
  await clearMemberId();
  redirect("/");
}

// ============================================================
// Trocar apelido
// ============================================================

const updateNickSchema = z.object({
  nickname: z.string().min(1).max(24).trim(),
});

export type UpdateNickResult = { ok: true } | { ok: false; error: string };

export async function updateNickname(formData: FormData): Promise<UpdateNickResult> {
  const memberId = await getMemberId();
  if (!memberId) return { ok: false, error: "Não autenticado." };
  const parsed = updateNickSchema.safeParse({ nickname: formData.get("nickname") });
  if (!parsed.success) return { ok: false, error: "Apelido inválido." };

  const admin = supabaseAdmin();

  // Pega bolão atual do membro
  const { data: me } = await admin
    .from("members")
    .select("bolao_id")
    .eq("id", memberId)
    .maybeSingle<{ bolao_id: string }>();
  if (!me) return { ok: false, error: "Membro não encontrado." };

  // Verifica colisão (case-insensitive)
  const { data: existing } = await admin
    .from("members")
    .select("id")
    .eq("bolao_id", me.bolao_id)
    .ilike("nickname", parsed.data.nickname)
    .neq("id", memberId)
    .maybeSingle<{ id: string }>();
  if (existing) return { ok: false, error: "Esse apelido já tá em uso." };

  const { error } = await admin
    .from("members")
    .update({ nickname: parsed.data.nickname })
    .eq("id", memberId);
  if (error) return { ok: false, error: "Falha ao atualizar." };

  revalidatePath("/", "layout");
  return { ok: true };
}

// ============================================================
// Pega membro atual (helper)
// ============================================================

export async function getCurrentMember() {
  const id = await getMemberId();
  if (!id) return null;
  return getMember(id);
}
