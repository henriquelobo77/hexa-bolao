// ============================================================
// HEXA · Cron endpoint
// ------------------------------------------------------------
// Disparado pelo cron-job.org (e/ou Vercel Cron) periodicamente
// pra puxar resultados da football-data.org.
//
// Auth: header `Authorization: Bearer ${CRON_SECRET}`.
//
// Importante: usa safeSyncMatches — NUNCA sobrescreve placar
// de jogo já finalizado, mesmo se a API esportiva flutuar.
// ============================================================

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { fetchAllMatches, mapMatches, FootballApiError } from "@/lib/football-api";
import { safeSyncMatches } from "@/lib/safe-sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.FOOTBALL_DATA_TOKEN;
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "FOOTBALL_DATA_TOKEN ausente" },
      { status: 500 }
    );
  }

  const supabase = supabaseAdmin();
  const { data: bolao } = await supabase
    .from("bolao")
    .select("id")
    .limit(1)
    .maybeSingle<{ id: string }>();
  if (!bolao) {
    return NextResponse.json({ ok: false, error: "Nenhum bolão" }, { status: 404 });
  }

  try {
    const apiMatches = await fetchAllMatches(token);
    const mapped = mapMatches(apiMatches);

    const result = await safeSyncMatches(supabase, bolao.id, mapped);
    if (result.error) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      processed: result.processed,
      finished: result.finished,
      live: result.live,
      at: new Date().toISOString(),
    });
  } catch (e) {
    const msg =
      e instanceof FootballApiError
        ? `API ${e.status ?? ""}: ${e.message}`
        : e instanceof Error
        ? e.message
        : "Erro desconhecido";
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
