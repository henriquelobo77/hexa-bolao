"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseAdmin } from "../supabase";
import { setMemberId, clearMemberId, getMemberId } from "../session";
import { getBolaoByCode, getMember } from "../queries";

// ============================================================
// Entrar no bolão (cria/recupera membro, valida PIN, seta cookie)
// ============================================================

const joinSchema = z.object({
  code: z.string().min(3).max(32),
  nickname: z.string().min(1).max(24).trim(),
  pin: z.string().regex(/^\d{4,6}$/, "PIN tem que ser 4 a 6 dígitos"),
});

export type JoinResult =
  | { ok: true; bolaoSlug: string }
  | { ok: false; error: string };

export async function joinBolao(formData: FormData): Promise<JoinResult> {
  const parsed = joinSchema.safeParse({
    code: formData.get("code"),
    nickname: formData.get("nickname"),
    pin: formData.get("pin"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.errors[0]?.message ??
        "Código, apelido e PIN são obrigatórios.",
    };
  }
  const { code, nickname, pin } = parsed.data;

  const bolao = await getBolaoByCode(code);
  if (!bolao) {
    return { ok: false, error: "Código do bolão não encontrado." };
  }

  const admin = supabaseAdmin();

  // 1. Checa se já existe membro com esse apelido (case-insensitive)
  const { data: existing } = await admin
    .from("members")
    .select("id, pin_hash")
    .eq("bolao_id", bolao.id)
    .ilike("nickname", nickname)
    .maybeSingle<{ id: string; pin_hash: string | null }>();

  let memberId: string;

  if (existing) {
    if (existing.pin_hash) {
      // Membro com PIN definido — valida via RPC
      const { data: authed, error: authErr } = await admin.rpc("auth_member", {
        p_bolao_id: bolao.id,
        p_nickname: nickname,
        p_pin: pin,
      });
      if (authErr) {
        console.error("[joinBolao] auth_member", authErr);
        return { ok: false, error: "Falha ao validar PIN." };
      }
      if (!authed) {
        return { ok: false, error: "PIN incorreto." };
      }
      memberId = authed as string;
    } else {
      // Membro sem PIN (legado ou foi resetado pelo admin) — define agora
      const { error: setErr } = await admin.rpc("set_member_pin", {
        p_member_id: existing.id,
        p_new_pin: pin,
      });
      if (setErr) {
        console.error("[joinBolao] set_member_pin", setErr);
        return { ok: false, error: "Falha ao definir PIN." };
      }
      memberId = existing.id;
    }

    // Atualiza last_seen
    await admin
      .from("members")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", memberId);
  } else {
    // Novo membro — antes valida cap de membros
    if (bolao.max_members != null) {
      const { count } = await admin
        .from("members")
        .select("*", { count: "exact", head: true })
        .eq("bolao_id", bolao.id);
      if ((count ?? 0) >= bolao.max_members) {
        return { ok: false, error: "Bolão lotado. Fala com o admin." };
      }
    }

    // Cria via RPC pra fazer o hash no banco
    const { data: newId, error: createErr } = await admin.rpc(
      "create_member_with_pin",
      {
        p_bolao_id: bolao.id,
        p_nickname: nickname,
        p_pin: pin,
      }
    );
    if (createErr || !newId) {
      console.error("[joinBolao] create_member_with_pin", createErr);
      return { ok: false, error: "Não consegui te cadastrar. Tenta de novo." };
    }
    memberId = newId as string;
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

  const { data: me } = await admin
    .from("members")
    .select("bolao_id")
    .eq("id", memberId)
    .maybeSingle<{ bolao_id: string }>();
  if (!me) return { ok: false, error: "Membro não encontrado." };

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
// Trocar PIN (usuário logado precisa confirmar o PIN atual)
// ============================================================

const changePinSchema = z.object({
  current_pin: z.string().regex(/^\d{4,6}$/, "PIN atual inválido"),
  new_pin: z.string().regex(/^\d{4,6}$/, "Novo PIN deve ter 4-6 dígitos"),
});

export type ChangePinResult = { ok: true } | { ok: false; error: string };

export async function changePin(formData: FormData): Promise<ChangePinResult> {
  const memberId = await getMemberId();
  if (!memberId) return { ok: false, error: "Não autenticado." };
  const parsed = changePinSchema.safeParse({
    current_pin: formData.get("current_pin"),
    new_pin: formData.get("new_pin"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.errors[0]?.message ?? "PIN inválido.",
    };
  }

  const admin = supabaseAdmin();

  // Pega bolão + apelido pra usar no auth_member
  const { data: me } = await admin
    .from("members")
    .select("bolao_id, nickname")
    .eq("id", memberId)
    .maybeSingle<{ bolao_id: string; nickname: string }>();
  if (!me) return { ok: false, error: "Membro não encontrado." };

  // Valida o PIN atual
  const { data: authed } = await admin.rpc("auth_member", {
    p_bolao_id: me.bolao_id,
    p_nickname: me.nickname,
    p_pin: parsed.data.current_pin,
  });
  if (!authed) return { ok: false, error: "PIN atual incorreto." };

  // Seta o novo
  const { error } = await admin.rpc("set_member_pin", {
    p_member_id: memberId,
    p_new_pin: parsed.data.new_pin,
  });
  if (error) return { ok: false, error: "Falha ao salvar." };

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
