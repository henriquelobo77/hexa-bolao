// ============================================================
// HEXA · Export CSV (admin)
// ------------------------------------------------------------
// GET /api/admin/export?kind=ranking
// GET /api/admin/export?kind=predictions
// GET /api/admin/export?kind=members
// ------------------------------------------------------------
// Requer cookie de admin (mesmo do painel).
// ============================================================

import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import {
  getMatches,
  getMembers,
  getPredictionsForBolao,
  getScoringConfig,
  getPredictionDistribution,
  getRanking,
} from "@/lib/queries";
import { scorePrediction } from "@/lib/scoring";
import type { Bolao } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function csv(rows: (string | number | null)[][]): string {
  return rows.map((r) => r.map(csvEscape).join(",")).join("\r\n");
}

export async function GET(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const url = new URL(request.url);
  const kind = url.searchParams.get("kind") ?? "ranking";

  const supabase = supabaseAdmin();
  const { data: bolao } = await supabase
    .from("bolao")
    .select("*")
    .limit(1)
    .maybeSingle<Bolao>();
  if (!bolao) return NextResponse.json({ error: "Bolão ausente." }, { status: 404 });

  let text = "";
  let filename = "export.csv";

  if (kind === "ranking") {
    const ranking = await getRanking(bolao.id);
    text = csv([
      ["rank", "nickname", "total_points", "predictions_made"],
      ...ranking.map((r) => [r.rank, r.nickname, r.total_points, r.predictions_made]),
    ]);
    filename = `${bolao.slug}-ranking.csv`;
  } else if (kind === "members") {
    const members = await getMembers(bolao.id);
    text = csv([
      ["id", "nickname", "joined_at", "last_seen_at"],
      ...members.map((m) => [m.id, m.nickname, m.created_at, m.last_seen_at]),
    ]);
    filename = `${bolao.slug}-membros.csv`;
  } else if (kind === "predictions") {
    const [matches, members, predictions, cfg, distribution] = await Promise.all([
      getMatches(bolao.id),
      getMembers(bolao.id),
      getPredictionsForBolao(bolao.id),
      getScoringConfig(bolao.id),
      getPredictionDistribution(bolao.id),
    ]);
    if (!cfg) return NextResponse.json({ error: "Config ausente." }, { status: 500 });
    const matchById = new Map(matches.map((m) => [m.id, m]));
    const memberById = new Map(members.map((m) => [m.id, m]));

    const rows: (string | number | null)[][] = [
      [
        "member",
        "kickoff",
        "phase",
        "home_code",
        "away_code",
        "home_guess",
        "away_guess",
        "home_official",
        "away_official",
        "kind",
        "multiplier",
        "zebra_bonus",
        "total_points",
      ],
    ];
    for (const p of predictions) {
      const match = matchById.get(p.match_id);
      const member = memberById.get(p.member_id);
      if (!match || !member) continue;
      const scored = scorePrediction(p, match, cfg, distribution);
      rows.push([
        member.nickname,
        match.kickoff_at,
        match.phase,
        match.team_home_code,
        match.team_away_code,
        p.home_score,
        p.away_score,
        match.official_home_score,
        match.official_away_score,
        scored.kind,
        scored.multiplier,
        scored.zebra_bonus,
        scored.total_points,
      ]);
    }
    text = csv(rows);
    filename = `${bolao.slug}-palpites.csv`;
  } else {
    return NextResponse.json({ error: "kind inválido" }, { status: 400 });
  }

  return new Response("﻿" + text, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
