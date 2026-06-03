/* eslint-disable no-console */
// ============================================================
// HEXA · Sync com football-data.org
// ------------------------------------------------------------
// Puxa todos os 104 jogos da Copa do Mundo 2026 da API oficial
// e faz upsert na tabela matches via external_id.
//
// Uso:
//   npm run sync          → upsert (não deleta jogos manuais)
//   npm run sync -- --reset → deleta todos os jogos antes (use no 1º sync)
//
// Variáveis de ambiente necessárias:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   FOOTBALL_DATA_TOKEN
// ============================================================

import { createClient } from "@supabase/supabase-js";
import { fetchAllMatches, mapMatches, type MappedMatch } from "../lib/football-api";
import * as fs from "node:fs";
import * as path from "node:path";

function loadEnvLocal() {
  const file = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(file)) return;
  const text = fs.readFileSync(file, "utf8");
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvLocal();

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TOKEN = process.env.FOOTBALL_DATA_TOKEN;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("[sync] Falta SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY em .env.local");
  process.exit(1);
}
if (!TOKEN) {
  console.error("[sync] Falta FOOTBALL_DATA_TOKEN em .env.local");
  console.error("        Registre em https://www.football-data.org/client/register");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const RESET = process.argv.includes("--reset");

async function getBolaoId(): Promise<string> {
  const { data, error } = await supabase
    .from("bolao")
    .select("id, name")
    .limit(1)
    .maybeSingle<{ id: string; name: string }>();
  if (error || !data) {
    console.error("[sync] Nenhum bolão encontrado. Rode `npm run seed` antes.");
    process.exit(1);
  }
  console.log(`[sync] Bolão alvo: ${data.name}`);
  return data.id;
}

async function maybeReset(bolaoId: string) {
  if (!RESET) return;
  console.log("[sync] --reset: limpando matches existentes...");
  const { error } = await supabase.from("matches").delete().eq("bolao_id", bolaoId);
  if (error) {
    console.error("[sync] Erro ao limpar:", error);
    process.exit(1);
  }
  console.log("[sync] Matches limpos.");
}

async function upsertMatches(bolaoId: string, matches: MappedMatch[]) {
  // Adiciona bolao_id em cada um
  const rows = matches.map((m) => ({ ...m, bolao_id: bolaoId }));

  // Upsert em lotes de 50 (limite seguro)
  const BATCH = 50;
  let inserted = 0;
  let updated = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error, count } = await supabase
      .from("matches")
      .upsert(batch, { onConflict: "bolao_id,external_id", count: "exact" });
    if (error) {
      console.error(`[sync] Erro upsertando ${i}-${i + batch.length}:`, error);
      process.exit(1);
    }
    // count pode vir misturado; tratamos como total processado
    inserted += batch.length;
    updated += count ?? 0;
  }
  return { processed: rows.length };
}

async function main() {
  const bolaoId = await getBolaoId();

  console.log("[sync] Chamando football-data.org...");
  const apiMatches = await fetchAllMatches(TOKEN!);
  console.log(`[sync] API retornou ${apiMatches.length} partidas.`);

  if (apiMatches.length === 0) {
    console.warn("[sync] API retornou lista vazia. Pode ser que a Copa não esteja");
    console.warn("       no plano free ou a competition code mudou.");
    process.exit(0);
  }

  const mapped = mapMatches(apiMatches);
  console.log(`[sync] Mapeadas: ${mapped.length} partidas (${mapped.filter((m) => m.phase === "grupos").length} fase de grupos).`);

  await maybeReset(bolaoId);
  const { processed } = await upsertMatches(bolaoId, mapped);

  // Resumo
  const finished = mapped.filter((m) => m.status === "finished").length;
  const live = mapped.filter((m) => m.status === "live").length;
  console.log("");
  console.log("✓ Sync concluído.");
  console.log(`  Processadas: ${processed}`);
  console.log(`  Finalizadas: ${finished}`);
  console.log(`  Ao vivo:     ${live}`);
  console.log("");
}

main().catch((e) => {
  console.error("[sync] Erro:", e);
  process.exit(1);
});
