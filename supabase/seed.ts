/* eslint-disable no-console */
// ============================================================
// HEXA · Seed script
// ------------------------------------------------------------
// Cria o bolão "Galera do Boteco", a config padrão de pontuação,
// e insere as 104 partidas da Copa 2026 (geradas em lib/fixtures).
//
// Uso:
//   1. Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local
//   2. Configure ADMIN_PASSWORD e BOLAO_JOIN_CODE (opcional)
//   3. npm run seed
//
// É idempotente — pode rodar de novo, ele faz upsert por slug.
// ============================================================

import { createClient } from "@supabase/supabase-js";
import { fixtures } from "../lib/fixtures";
import * as fs from "node:fs";
import * as path from "node:path";

// Carrega .env.local manualmente (sem dotenv pra não adicionar dep)
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
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "trocar-em-prod";
const JOIN_CODE = (process.env.BOLAO_JOIN_CODE ?? "HEXA2026").toUpperCase();
const BOLAO_NAME = process.env.BOLAO_NAME ?? "Galera do Boteco";
const BOLAO_SLUG = process.env.BOLAO_SLUG ?? "galera-do-boteco";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("[seed] Faltam SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY em .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function seed() {
  console.log("[seed] Iniciando seed...");

  // 1. Upsert bolão
  const { data: bolao, error: bolaoErr } = await supabase
    .from("bolao")
    .upsert(
      {
        slug: BOLAO_SLUG,
        name: BOLAO_NAME,
        join_code: JOIN_CODE,
        admin_password: ADMIN_PASSWORD,
        starts_at: "2026-06-11T16:00:00-03:00",
        ends_at: "2026-07-19T17:00:00-03:00",
      },
      { onConflict: "slug" }
    )
    .select()
    .single();

  if (bolaoErr || !bolao) {
    console.error("[seed] Erro ao criar bolão:", bolaoErr);
    process.exit(1);
  }
  console.log(`[seed] Bolão "${bolao.name}" pronto. Código de entrada: ${bolao.join_code}`);

  // 2. Upsert scoring_config com defaults
  const { error: configErr } = await supabase
    .from("scoring_config")
    .upsert({ bolao_id: bolao.id }, { onConflict: "bolao_id" });
  if (configErr) {
    console.error("[seed] Erro ao criar scoring_config:", configErr);
    process.exit(1);
  }
  console.log("[seed] scoring_config padrão pronto.");

  // 3. Wipe + insert matches (mais simples que upsert dado o volume)
  const { error: delErr } = await supabase
    .from("matches")
    .delete()
    .eq("bolao_id", bolao.id);
  if (delErr) {
    console.error("[seed] Erro ao limpar matches:", delErr);
    process.exit(1);
  }

  const rows = fixtures.map((f) => ({ ...f, bolao_id: bolao.id }));
  // Insere em lotes de 50 (limite seguro p/ Supabase)
  const BATCH = 50;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase.from("matches").insert(batch);
    if (error) {
      console.error(`[seed] Erro inserindo matches ${i}-${i + batch.length}:`, error);
      process.exit(1);
    }
  }
  console.log(`[seed] ${rows.length} partidas inseridas.`);

  console.log("");
  console.log("✓ Seed concluído.");
  console.log("");
  console.log(`  Bolão:      ${bolao.name}`);
  console.log(`  Slug:       ${bolao.slug}`);
  console.log(`  Código:     ${bolao.join_code}`);
  console.log(`  Admin pwd:  ${ADMIN_PASSWORD === "trocar-em-prod" ? "(padrão — TROQUE!)" : "(configurada)"}`);
  console.log("");
}

seed().catch((e) => {
  console.error("[seed] Erro inesperado:", e);
  process.exit(1);
});
