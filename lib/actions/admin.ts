"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseAdmin } from "../supabase";
import { isAdmin, setAdmin, clearAdmin } from "../session";
import type { PickKind, MatchStatus } from "../types";

// ============================================================
// Login do admin (compara com ADMIN_PASSWORD do bolão)
// ============================================================

async function ensureAdmin() {
  if (!(await isAdmin())) {
    throw new Error("Não autorizado.");
  }
}

export type AdminLoginResult = { ok: true } | { ok: false; error: string };

export async function adminLogin(formData: FormData): Promise<AdminLoginResult> {
  const password = String(formData.get("password") ?? "");
  if (!password) return { ok: false, error: "Senha obrigatória." };

  const admin = supabaseAdmin();
  // Compara contra qualquer bolão cuja senha bata.
  // Importante: usa .limit(1) sem maybeSingle pra não quebrar quando
  // dois bolões compartilham a mesma senha.
  const { data, error } = await admin
    .from("bolao")
    .select("id, admin_password")
    .eq("admin_password", password)
    .limit(1)
    .returns<{ id: string; admin_password: string }[]>();

  if (error) {
    console.error("[adminLogin]", error);
    return { ok: false, error: "Erro ao validar senha." };
  }
  if (!data || data.length === 0) return { ok: false, error: "Senha incorreta." };

  await setAdmin();
  return { ok: true };
}

export async function adminLogout() {
  await clearAdmin();
  redirect("/admin");
}

// ============================================================
// Lançar resultado oficial de um jogo
// ============================================================

const setResultSchema = z.object({
  match_id: z.string().uuid(),
  home_score: z.coerce.number().int().min(0).max(30),
  away_score: z.coerce.number().int().min(0).max(30),
  status: z.enum(["scheduled", "live", "finished", "cancelled"]).default("finished"),
  official_advances_team_code: z.string().max(8).optional().nullable(),
});

export async function adminSetResult(formData: FormData) {
  await ensureAdmin();
  const parsed = setResultSchema.safeParse({
    match_id: formData.get("match_id"),
    home_score: formData.get("home_score"),
    away_score: formData.get("away_score"),
    status: formData.get("status") ?? "finished",
    official_advances_team_code: formData.get("official_advances_team_code") || null,
  });
  if (!parsed.success) return { ok: false, error: "Dados inválidos." };

  // Determina quem avança: se houver vencedor, é implícito; se empate, usa o explícito
  let advances: string | null = null;
  if (parsed.data.home_score !== parsed.data.away_score) {
    advances = null; // implícito do vencedor — calculado no scoring engine
  } else {
    advances = parsed.data.official_advances_team_code ?? null;
  }

  const admin = supabaseAdmin();

  // Pra empate em mata-mata, precisa do advances. Pra outras phases, ignora.
  // Como não temos o phase aqui sem outra query, deixa o caller mandar.
  // Se empate sem advances explícito, salva null (scoring engine sabe lidar).

  const { error } = await admin
    .from("matches")
    .update({
      official_home_score: parsed.data.home_score,
      official_away_score: parsed.data.away_score,
      official_advances_team_code: advances,
      status: parsed.data.status as MatchStatus,
    })
    .eq("id", parsed.data.match_id);

  if (error) {
    console.error("[adminSetResult]", error);
    return { ok: false, error: "Falha ao salvar resultado." };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function adminClearResult(formData: FormData) {
  await ensureAdmin();
  const matchId = String(formData.get("match_id") ?? "");
  if (!matchId) return { ok: false, error: "ID ausente." };
  const admin = supabaseAdmin();
  const { error } = await admin
    .from("matches")
    .update({
      official_home_score: null,
      official_away_score: null,
      status: "scheduled" as MatchStatus,
    })
    .eq("id", matchId);
  if (error) return { ok: false, error: "Falha ao limpar." };
  revalidatePath("/", "layout");
  return { ok: true };
}

// ============================================================
// Editar metadados do jogo (times, data, sede)
// ============================================================

const updateMatchSchema = z.object({
  match_id: z.string().uuid(),
  team_home_code: z.string().min(1).max(8),
  team_home_name: z.string().min(1).max(64),
  team_away_code: z.string().min(1).max(8),
  team_away_name: z.string().min(1).max(64),
  kickoff_at: z.string().min(1),
  venue: z.string().max(64).optional(),
});

export async function adminUpdateMatch(formData: FormData) {
  await ensureAdmin();
  const parsed = updateMatchSchema.safeParse({
    match_id: formData.get("match_id"),
    team_home_code: formData.get("team_home_code"),
    team_home_name: formData.get("team_home_name"),
    team_away_code: formData.get("team_away_code"),
    team_away_name: formData.get("team_away_name"),
    kickoff_at: formData.get("kickoff_at"),
    venue: formData.get("venue") ?? undefined,
  });
  if (!parsed.success) return { ok: false, error: "Dados inválidos." };

  const admin = supabaseAdmin();
  const { match_id, ...rest } = parsed.data;
  const { error } = await admin.from("matches").update(rest).eq("id", match_id);
  if (error) {
    console.error("[adminUpdateMatch]", error);
    return { ok: false, error: "Falha ao salvar." };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

// ============================================================
// Adicionar e remover jogo
// ============================================================

const addMatchSchema = z.object({
  bolao_id: z.string().uuid(),
  phase: z.enum(["grupos", "r32", "oitavas", "quartas", "semi", "terceiro", "final"]),
  group_letter: z.string().max(2).nullable().optional(),
  round_label: z.string().max(64).optional(),
  team_home_code: z.string().min(1).max(8),
  team_home_name: z.string().min(1).max(64),
  team_away_code: z.string().min(1).max(8),
  team_away_name: z.string().min(1).max(64),
  kickoff_at: z.string().min(1),
  venue: z.string().max(64).optional(),
});

export async function adminAddMatch(formData: FormData) {
  await ensureAdmin();
  const parsed = addMatchSchema.safeParse({
    bolao_id: formData.get("bolao_id"),
    phase: formData.get("phase"),
    group_letter: formData.get("group_letter") || null,
    round_label: formData.get("round_label") || undefined,
    team_home_code: formData.get("team_home_code"),
    team_home_name: formData.get("team_home_name"),
    team_away_code: formData.get("team_away_code"),
    team_away_name: formData.get("team_away_name"),
    kickoff_at: formData.get("kickoff_at"),
    venue: formData.get("venue") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: "Dados inválidos." };
  }
  const admin = supabaseAdmin();
  const { error } = await admin.from("matches").insert({
    ...parsed.data,
    order_index: 9999, // novo jogo vai no fim; admin pode reordenar
  });
  if (error) {
    console.error("[adminAddMatch]", error);
    return { ok: false, error: "Falha ao inserir." };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function adminDeleteMatch(formData: FormData) {
  await ensureAdmin();
  const matchId = String(formData.get("match_id") ?? "");
  if (!matchId) return { ok: false, error: "ID ausente." };
  const admin = supabaseAdmin();
  const { error } = await admin.from("matches").delete().eq("id", matchId);
  if (error) {
    console.error("[adminDeleteMatch]", error);
    return { ok: false, error: "Falha ao remover." };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

// ============================================================
// Atualizar config de pontuação
// ============================================================

const configSchema = z.object({
  bolao_id: z.string().uuid(),
  pts_placar_exato: z.coerce.number().int().min(0).max(100),
  pts_vencedor: z.coerce.number().int().min(0).max(100),
  pts_saldo: z.coerce.number().int().min(0).max(100),
  pts_quem_passa: z.coerce.number().int().min(0).max(100),
  mult_brasil: z.coerce.number().min(1).max(10),
  mult_oitavas: z.coerce.number().min(1).max(10),
  mult_quartas: z.coerce.number().min(1).max(10),
  mult_semi: z.coerce.number().min(1).max(10),
  mult_final: z.coerce.number().min(1).max(10),
  bonus_zebra_enabled: z.coerce.boolean(),
  bonus_zebra_max_hits: z.coerce.number().int().min(1).max(30),
  bonus_zebra_pts: z.coerce.number().int().min(0).max(100),
  pts_campeao: z.coerce.number().int().min(0).max(500),
  pts_artilheiro: z.coerce.number().int().min(0).max(500),
  enable_vice: z.coerce.boolean(),
  pts_vice: z.coerce.number().int().min(0).max(500),
  enable_semifinalistas: z.coerce.boolean(),
  pts_semifinalista: z.coerce.number().int().min(0).max(500),
  predict_deadline_min: z.coerce.number().int().min(0).max(720),
});

export async function adminUpdateScoring(formData: FormData) {
  await ensureAdmin();

  // FormData não envia booleans falsos para checkboxes desmarcadas
  const raw: Record<string, FormDataEntryValue | string> = {};
  for (const [k, v] of formData.entries()) raw[k] = v;
  for (const key of ["bonus_zebra_enabled", "enable_vice", "enable_semifinalistas"]) {
    raw[key] = raw[key] === "on" || raw[key] === "true" ? "true" : "false";
  }

  const parsed = configSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("[adminUpdateScoring] parse err", parsed.error.flatten());
    return { ok: false, error: "Dados inválidos." };
  }

  const admin = supabaseAdmin();
  const { bolao_id, ...rest } = parsed.data;
  const { error } = await admin
    .from("scoring_config")
    .update(rest)
    .eq("bolao_id", bolao_id);
  if (error) {
    console.error("[adminUpdateScoring]", error);
    return { ok: false, error: "Falha ao salvar config." };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

// ============================================================
// Lançar resultado dos palpites especiais
// ============================================================

const specialResultSchema = z.object({
  bolao_id: z.string().uuid(),
  kind: z.enum(["campeao", "artilheiro", "vice", "semifinalista"]),
  value: z.string().min(1).max(64).trim(),
  position: z.coerce.number().int().min(1).max(4).default(1),
});

export async function adminSetSpecialResult(formData: FormData) {
  await ensureAdmin();
  const parsed = specialResultSchema.safeParse({
    bolao_id: formData.get("bolao_id"),
    kind: formData.get("kind"),
    value: formData.get("value"),
    position: formData.get("position") ?? 1,
  });
  if (!parsed.success) return { ok: false, error: "Dados inválidos." };

  const admin = supabaseAdmin();
  const { error } = await admin
    .from("special_results")
    .upsert(
      { ...parsed.data, kind: parsed.data.kind as PickKind },
      { onConflict: "bolao_id,kind,position" }
    );
  if (error) {
    console.error("[adminSetSpecialResult]", error);
    return { ok: false, error: "Falha ao salvar." };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function adminClearSpecialResult(formData: FormData) {
  await ensureAdmin();
  const bolao_id = String(formData.get("bolao_id") ?? "");
  const kind = String(formData.get("kind") ?? "") as PickKind;
  const position = Number(formData.get("position") ?? 1);
  const admin = supabaseAdmin();
  const { error } = await admin
    .from("special_results")
    .delete()
    .eq("bolao_id", bolao_id)
    .eq("kind", kind)
    .eq("position", position);
  if (error) return { ok: false, error: "Falha ao limpar." };
  revalidatePath("/", "layout");
  return { ok: true };
}

// ============================================================
// Remover membro
// ============================================================

// ============================================================
// Criar novo bolão
// ============================================================

const createBolaoSchema = z.object({
  name: z.string().min(2).max(64).trim(),
  slug: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/, "Slug: a-z, 0-9, hífen"),
  join_code: z.string().min(3).max(32).trim(),
  admin_password: z.string().min(4).max(64),
  max_members: z.coerce.number().int().min(0).max(10000).optional(),
});

export async function adminCreateBolao(formData: FormData) {
  await ensureAdmin();
  const parsed = createBolaoSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    join_code: String(formData.get("join_code") ?? "").toUpperCase(),
    admin_password: formData.get("admin_password"),
    max_members: formData.get("max_members") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: "Dados inválidos." };
  }
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("bolao")
    .insert({
      ...parsed.data,
      max_members: parsed.data.max_members ?? null,
    })
    .select("id")
    .single<{ id: string }>();
  if (error || !data) {
    if (error?.code === "23505") return { ok: false, error: "Slug ou código já em uso." };
    return { ok: false, error: error?.message ?? "Falha." };
  }
  // Cria scoring_config padrão pra esse bolão
  await admin.from("scoring_config").insert({ bolao_id: data.id });
  revalidatePath("/", "layout");
  return { ok: true };
}

// ============================================================
// Atualizar configurações do bolão (nome, max_members)
// ============================================================

export async function adminUpdateBolao(formData: FormData) {
  await ensureAdmin();
  const id = String(formData.get("bolao_id") ?? "");
  if (!id) return { ok: false, error: "ID ausente." };
  const name = String(formData.get("name") ?? "").trim();
  const maxStr = String(formData.get("max_members") ?? "");
  const max_members = maxStr === "" ? null : Math.max(0, Math.min(10000, parseInt(maxStr, 10)));
  const admin = supabaseAdmin();
  const { error } = await admin.from("bolao").update({ name, max_members }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

// ============================================================
// Remover membro
// ============================================================

export async function adminRemoveMember(formData: FormData) {
  await ensureAdmin();
  const memberId = String(formData.get("member_id") ?? "");
  if (!memberId) return { ok: false, error: "ID ausente." };
  const admin = supabaseAdmin();
  const { error } = await admin.from("members").delete().eq("id", memberId);
  if (error) return { ok: false, error: "Falha ao remover." };
  revalidatePath("/", "layout");
  return { ok: true };
}

// ============================================================
// Resetar PIN de um membro (quando esquece)
// ============================================================

export async function adminResetMemberPin(formData: FormData) {
  await ensureAdmin();
  const memberId = String(formData.get("member_id") ?? "");
  if (!memberId) return { ok: false, error: "ID ausente." };
  const admin = supabaseAdmin();
  const { error } = await admin.rpc("admin_reset_member_pin", { p_member_id: memberId });
  if (error) {
    console.error("[adminResetMemberPin]", error);
    return { ok: false, error: "Falha ao resetar." };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
