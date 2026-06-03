#!/usr/bin/env node
// Push env vars do .env.local pra Vercel production via stdin sem newline.
// Uso: node scripts/push-envs.mjs

import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";

const file = ".env.local";
const text = readFileSync(file, "utf8");
const envs = {};
for (const raw of text.split("\n")) {
  const line = raw.trim();
  if (!line || line.startsWith("#")) continue;
  const eq = line.indexOf("=");
  if (eq < 0) continue;
  const k = line.slice(0, eq).trim();
  let v = line.slice(eq + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  if (k && v) envs[k] = v;
}

// Adiciona URL pública pro OG image
envs["NEXT_PUBLIC_APP_URL"] = "https://hexa-bolao-seven.vercel.app";

// Gera CRON_SECRET novo, limpo
const crypto = await import("node:crypto");
const cronSecret = crypto
  .randomBytes(32)
  .toString("base64")
  .replace(/[+/=]/g, "")
  .slice(0, 40);
envs["CRON_SECRET"] = cronSecret;

const vcCmd = process.platform === "win32" ? "vercel.cmd" : "vercel";
const NAMES = Object.keys(envs);

function run(args) {
  return new Promise((resolve) => {
    // shell: true necessário no Windows pra resolver vercel.cmd
    const p = spawn(vcCmd, args, { stdio: ["ignore", "pipe", "pipe"], shell: true });
    let out = "";
    let err = "";
    p.stdout.on("data", (d) => (out += d.toString()));
    p.stderr.on("data", (d) => (err += d.toString()));
    p.on("close", (code) => resolve({ code, out, err }));
  });
}

async function pushOne(name, value) {
  process.stdout.write(`→ ${name} `);
  await run(["env", "rm", name, "production", "--yes"]);
  const r = await run(["env", "add", name, "production", "--value", value, "--yes"]);
  if (r.code === 0 && /Added/.test(r.err + r.out)) {
    console.log(`✓ (${value.length} chars)`);
  } else {
    console.log(`✗ exit=${r.code}`);
    console.log("  out:", r.out.trim().split("\n").slice(-2).join(" | "));
    console.log("  err:", r.err.trim().split("\n").slice(-2).join(" | "));
  }
}

for (const name of NAMES) {
  await pushOne(name, envs[name]);
}

console.log("\n=== CRON_SECRET gerado:", cronSecret);
console.log("Use esse valor no header do cron-job.org:");
console.log(`  Authorization: Bearer ${cronSecret}`);
