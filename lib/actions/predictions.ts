"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseAdmin } from "../supabase";
import { getMemberId } from "../session";
import { getMatchById, getScoringConfig } from "../queries";
import { isPredictionOpen } from "../scoring";
import type { PickKind } from "../types";

// ============================================================
// Salvar palpite de placar
// ============================================================

const predictSchema = z.object({
  match_id: z.string().uuid(),
  home_score: z.coerce.number().int().min(0).max(20),
  away_score: z.coerce.number().int().min(0).max(20),
});

export type PredictResult = { ok: true } | { ok: false; error: string };

export async function savePrediction(formData: FormData): Promise<PredictResult> {
  const memberId = await getMemberId();
  if (!memberId) return { ok: false, error: "Você precisa entrar no bolão primeiro." };

  const parsed = predictSchema.safeParse({
    match_id: formData.get("match_id"),
    home_score: formData.get("home_score"),
    away_score: formData.get("away_score"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Palpite inválido." };
  }
  const { match_id, home_score, away_score } = parsed.data;

  const match = await getMatchById(match_id);
  if (!match) return { ok: false, error: "Jogo não encontrado." };
  const cfg = await getScoringConfig(match.bolao_id);
  if (!cfg) return { ok: false, error: "Configuração do bolão ausente." };
  if (!isPredictionOpen(match, cfg)) {
    return { ok: false, error: "Palpites já fechados para esse jogo." };
  }

  const admin = supabaseAdmin();
  const { error } = await admin
    .from("predictions")
    .upsert(
      { member_id: memberId, match_id, home_score, away_score },
      { onConflict: "member_id,match_id" }
    );

  if (error) {
    console.error("[savePrediction]", error);
    return { ok: false, error: "Falha ao salvar palpite." };
  }

  revalidatePath("/b", "layout");
  return { ok: true };
}

// ============================================================
// Salvar palpite especial (campeão, artilheiro, vice, semi)
// ============================================================

const specialSchema = z.object({
  kind: z.enum(["campeao", "artilheiro", "vice", "semifinalista"]),
  value: z.string().min(1).max(64).trim(),
  position: z.coerce.number().int().min(1).max(4).default(1),
});

export async function saveSpecialPick(formData: FormData): Promise<PredictResult> {
  const memberId = await getMemberId();
  if (!memberId) return { ok: false, error: "Você precisa entrar no bolão primeiro." };

  const parsed = specialSchema.safeParse({
    kind: formData.get("kind"),
    value: formData.get("value"),
    position: formData.get("position") ?? 1,
  });
  if (!parsed.success) return { ok: false, error: "Palpite inválido." };
  const { kind, value, position } = parsed.data;

  // Deadline dos especiais = abertura da Copa
  // (qualquer config menos restritiva precisaria de mais campos)
  const admin = supabaseAdmin();

  // Descobrir bolão a partir do member
  const { data: member } = await admin
    .from("members")
    .select("bolao_id")
    .eq("id", memberId)
    .maybeSingle<{ bolao_id: string }>();
  if (!member) return { ok: false, error: "Membro não encontrado." };

  const { data: bolao } = await admin
    .from("bolao")
    .select("starts_at")
    .eq("id", member.bolao_id)
    .maybeSingle<{ starts_at: string }>();
  if (bolao && new Date(bolao.starts_at).getTime() <= Date.now()) {
    return { ok: false, error: "Os palpites especiais já fecharam (Copa começou)." };
  }

  const { error } = await admin
    .from("special_picks")
    .upsert(
      { member_id: memberId, kind: kind as PickKind, value, position },
      { onConflict: "member_id,kind,position" }
    );

  if (error) {
    console.error("[saveSpecialPick]", error);
    return { ok: false, error: "Falha ao salvar palpite." };
  }

  revalidatePath("/b", "layout");
  return { ok: true };
}

// ============================================================
// Remover palpite especial (semifinalista, por exemplo, se mudar)
// ============================================================

export async function removeSpecialPick(formData: FormData): Promise<PredictResult> {
  const memberId = await getMemberId();
  if (!memberId) return { ok: false, error: "Não autenticado." };

  const kind = formData.get("kind") as PickKind | null;
  const position = Number(formData.get("position") ?? 1);
  if (!kind) return { ok: false, error: "Parâmetro ausente." };

  const admin = supabaseAdmin();
  const { error } = await admin
    .from("special_picks")
    .delete()
    .eq("member_id", memberId)
    .eq("kind", kind)
    .eq("position", position);

  if (error) {
    console.error("[removeSpecialPick]", error);
    return { ok: false, error: "Falha ao remover." };
  }
  revalidatePath("/b", "layout");
  return { ok: true };
}
