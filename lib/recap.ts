// ============================================================
// HEXA · Resumo diário (pra mandar no grupo do WhatsApp)
// ============================================================

import { supabaseAdmin } from "./supabase";
import {
  getMatches,
  getPredictionsForBolao,
  getScoringConfig,
  getMembers,
  getPredictionDistribution,
  getRanking,
} from "./queries";
import { scorePrediction } from "./scoring";
import { fmtTime, dayKeyBR } from "./date";
import type { Match, Member, Prediction } from "./types";

export interface DailyRecap {
  date: string;            // YYYY-MM-DD (BR)
  dateLabel: string;       // "12 de junho"
  bolaoName: string;
  matchesToday: Array<{
    home: string;
    away: string;
    homeCode: string;
    awayCode: string;
    homeScore: number | null;
    awayScore: number | null;
    finished: boolean;
    kickoff: string;
    isBrazil: boolean;
  }>;
  topScorers: Array<{
    nickname: string;
    dailyPoints: number;
    zebras: number;
    exatos: number;
  }>;
  overallTop: Array<{
    rank: number;
    nickname: string;
    points: number;
  }>;
  text: string; // texto pronto pra colar no WhatsApp
}

function dateLabelBR(yyyymmdd: string): string {
  const [y, m, d] = yyyymmdd.split("-").map(Number);
  // Constrói no fuso BR pra evitar off-by-one
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

export async function buildDailyRecap(
  bolaoId: string,
  dateKey: string // YYYY-MM-DD em BR
): Promise<DailyRecap | null> {
  const supabase = supabaseAdmin();
  const { data: bolao } = await supabase
    .from("bolao")
    .select("name")
    .eq("id", bolaoId)
    .maybeSingle<{ name: string }>();
  if (!bolao) return null;

  const [matches, predictions, cfg, members, distribution, ranking] =
    await Promise.all([
      getMatches(bolaoId),
      getPredictionsForBolao(bolaoId),
      getScoringConfig(bolaoId),
      getMembers(bolaoId),
      getPredictionDistribution(bolaoId),
      getRanking(bolaoId),
    ]);

  if (!cfg) return null;

  const todayMatches = matches.filter((m) => dayKeyBR(m.kickoff_at) === dateKey);

  // Pontuação do dia por membro (só de jogos finalizados hoje)
  const dailyPts = new Map<string, { pts: number; zebras: number; exatos: number }>();
  const memberById = new Map(members.map((m) => [m.id, m]));

  for (const match of todayMatches) {
    if (match.status !== "finished") continue;
    const preds = predictions.filter((p) => p.match_id === match.id);
    for (const p of preds) {
      const scored = scorePrediction(p, match, cfg, distribution);
      const cur = dailyPts.get(p.member_id) ?? { pts: 0, zebras: 0, exatos: 0 };
      cur.pts += scored.total_points;
      if (scored.zebra_bonus > 0) cur.zebras++;
      if (scored.kind === "exato" || scored.kind === "empate_exato") cur.exatos++;
      dailyPts.set(p.member_id, cur);
    }
  }

  const topScorers = Array.from(dailyPts.entries())
    .map(([memberId, s]) => ({
      nickname: memberById.get(memberId)?.nickname ?? "?",
      dailyPoints: s.pts,
      zebras: s.zebras,
      exatos: s.exatos,
    }))
    .filter((r) => r.dailyPoints > 0)
    .sort((a, b) => b.dailyPoints - a.dailyPoints)
    .slice(0, 5);

  const overallTop = ranking.slice(0, 5).map((r) => ({
    rank: r.rank,
    nickname: r.nickname,
    points: r.total_points,
  }));

  const matchesToday = todayMatches
    .sort((a, b) => a.kickoff_at.localeCompare(b.kickoff_at))
    .map((m) => ({
      home: m.team_home_name,
      away: m.team_away_name,
      homeCode: m.team_home_code,
      awayCode: m.team_away_code,
      homeScore: m.official_home_score,
      awayScore: m.official_away_score,
      finished: m.status === "finished",
      kickoff: fmtTime(m.kickoff_at),
      isBrazil: m.team_home_code === "BRA" || m.team_away_code === "BRA",
    }));

  const text = formatRecapText({
    dateLabel: dateLabelBR(dateKey),
    bolaoName: bolao.name,
    matchesToday,
    topScorers,
    overallTop,
  });

  return {
    date: dateKey,
    dateLabel: dateLabelBR(dateKey),
    bolaoName: bolao.name,
    matchesToday,
    topScorers,
    overallTop,
    text,
  };
}

function formatRecapText(r: {
  dateLabel: string;
  bolaoName: string;
  matchesToday: DailyRecap["matchesToday"];
  topScorers: DailyRecap["topScorers"];
  overallTop: DailyRecap["overallTop"];
}): string {
  const lines: string[] = [];
  lines.push(`🏆 *${r.bolaoName.toUpperCase()}*`);
  lines.push(`📅 ${r.dateLabel}`);
  lines.push("");

  if (r.matchesToday.length > 0) {
    lines.push("⚽ *JOGOS DE HOJE*");
    for (const m of r.matchesToday) {
      const star = m.isBrazil ? "🇧🇷 " : "";
      if (m.finished) {
        lines.push(`${star}${m.homeCode} ${m.homeScore}–${m.awayScore} ${m.awayCode}`);
      } else {
        lines.push(`${star}${m.homeCode} × ${m.awayCode} · ${m.kickoff}`);
      }
    }
    lines.push("");
  }

  if (r.topScorers.length > 0) {
    lines.push("🔥 *PONTUADORES DO DIA*");
    const medals = ["🥇", "🥈", "🥉"];
    r.topScorers.forEach((s, i) => {
      const medal = medals[i] ?? `${i + 1}º`;
      const extras: string[] = [];
      if (s.zebras > 0) extras.push(`${s.zebras} zebra${s.zebras > 1 ? "s" : ""} cravada${s.zebras > 1 ? "s" : ""}`);
      if (s.exatos > 0 && s.zebras === 0) extras.push(`${s.exatos} placar exato`);
      const tail = extras.length ? ` · ${extras.join(", ")}` : "";
      lines.push(`${medal} ${s.nickname} · +${s.dailyPoints} pts${tail}`);
    });
    lines.push("");
  }

  if (r.overallTop.length > 0) {
    lines.push("📊 *RANKING ATUAL · TOP 5*");
    for (const r2 of r.overallTop) {
      lines.push(`${String(r2.rank).padStart(2, "0")}. ${r2.nickname} · ${r2.points} pts`);
    }
    lines.push("");
  }

  lines.push("Boas resenhas! 🍻");
  return lines.join("\n");
}
