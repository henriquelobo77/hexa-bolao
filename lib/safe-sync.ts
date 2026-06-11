import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type { MappedMatch } from "./football-api";

// ============================================================
// Safe upsert de matches vindas da football-data.org
// ------------------------------------------------------------
// Regra de ouro: NUNCA sobrescrever placar/status de um jogo
// já marcado como 'finished' no nosso banco. A API esportiva
// flutua (às vezes "esquece" que o jogo acabou) e isso
// estava limpando o resultado já gravado.
// ============================================================

export async function safeSyncMatches(
  supabase: SupabaseClient<Database>,
  bolaoId: string,
  mapped: MappedMatch[]
): Promise<{ error: string | null; processed: number; finished: number; live: number }> {
  // 1. Snapshot dos jogos já finalizados (com placar) — esses são "intocáveis"
  const { data: existing } = await supabase
    .from("matches")
    .select(
      "external_id, status, official_home_score, official_away_score, official_advances_team_code"
    )
    .eq("bolao_id", bolaoId)
    .eq("status", "finished");

  const locked = new Map(
    (existing ?? [])
      .filter((m) => m.external_id != null)
      .map((m) => [m.external_id as string, m])
  );

  // 2. Pra cada mapped, decide se preserva ou substitui
  const rows = mapped.map((m) => {
    const prev = locked.get(m.external_id);
    if (prev) {
      // Jogo travado: preserva tudo que é resultado, atualiza apenas metadados
      return {
        ...m,
        bolao_id: bolaoId,
        status: prev.status,
        official_home_score: prev.official_home_score,
        official_away_score: prev.official_away_score,
        official_advances_team_code: prev.official_advances_team_code,
      };
    }
    return { ...m, bolao_id: bolaoId };
  });

  // 3. Upsert em lotes
  const BATCH = 50;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase
      .from("matches")
      .upsert(batch, { onConflict: "bolao_id,external_id" });
    if (error) {
      return {
        error: error.message,
        processed: 0,
        finished: 0,
        live: 0,
      };
    }
  }

  return {
    error: null,
    processed: rows.length,
    finished: rows.filter((r) => r.status === "finished").length,
    live: rows.filter((r) => r.status === "live").length,
  };
}
