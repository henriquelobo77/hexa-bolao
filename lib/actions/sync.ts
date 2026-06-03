"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "../supabase";
import { isAdmin } from "../session";
import { fetchAllMatches, mapMatches, FootballApiError } from "../football-api";

// ============================================================
// Sync com football-data.org disparado pelo painel admin
// ============================================================

export type SyncResult =
  | { ok: true; processed: number; finished: number; live: number }
  | { ok: false; error: string };

export async function adminSyncMatches(formData: FormData): Promise<SyncResult> {
  if (!(await isAdmin())) {
    return { ok: false, error: "Não autorizado." };
  }
  const reset = formData.get("wipe") === "1";

  const token = process.env.FOOTBALL_DATA_TOKEN;
  if (!token) {
    return { ok: false, error: "FOOTBALL_DATA_TOKEN ausente nas envs." };
  }

  const supabase = supabaseAdmin();
  const { data: bolao } = await supabase
    .from("bolao")
    .select("id")
    .limit(1)
    .maybeSingle<{ id: string }>();
  if (!bolao) return { ok: false, error: "Nenhum bolão encontrado." };

  let apiMatches;
  try {
    apiMatches = await fetchAllMatches(token);
  } catch (e) {
    if (e instanceof FootballApiError) {
      return { ok: false, error: `API: ${e.message}` };
    }
    return { ok: false, error: "Falha ao chamar API." };
  }

  if (apiMatches.length === 0) {
    return { ok: false, error: "API retornou 0 partidas (token inválido ou competição fora do plano)." };
  }

  const mapped = mapMatches(apiMatches);

  if (reset) {
    const { error } = await supabase.from("matches").delete().eq("bolao_id", bolao.id);
    if (error) return { ok: false, error: `Reset falhou: ${error.message}` };
  }

  const rows = mapped.map((m) => ({ ...m, bolao_id: bolao.id }));
  const BATCH = 50;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase
      .from("matches")
      .upsert(batch, { onConflict: "bolao_id,external_id" });
    if (error) {
      return { ok: false, error: `Upsert falhou: ${error.message}` };
    }
  }

  revalidatePath("/", "layout");
  return {
    ok: true,
    processed: rows.length,
    finished: mapped.filter((m) => m.status === "finished").length,
    live: mapped.filter((m) => m.status === "live").length,
  };
}
