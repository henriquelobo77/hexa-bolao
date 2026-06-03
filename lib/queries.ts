// ============================================================
// HEXA · Server-side read helpers
// ------------------------------------------------------------
// Tudo aqui roda em Server Components / Server Actions, usando
// o cliente server-side (anon key + cookies). Para leituras que
// alimentam UI pública.
// ============================================================

import { supabaseServer } from "./supabase";
import { buildRanking } from "./scoring";
import type {
  Bolao,
  Match,
  Member,
  Prediction,
  PredictionDistribution,
  ScoringConfig,
  SpecialPick,
  SpecialResult,
  RankingRow,
} from "./types";

// ------------------------------------------------------------
// Bolão
// ------------------------------------------------------------

export async function getBolaoByCode(code: string): Promise<Bolao | null> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("bolao")
    .select("*")
    .eq("join_code", code.toUpperCase())
    .maybeSingle<Bolao>();
  if (error) {
    console.error("[queries] getBolaoByCode", error);
    return null;
  }
  return data;
}

export async function getBolaoBySlug(slug: string): Promise<Bolao | null> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("bolao")
    .select("*")
    .eq("slug", slug)
    .maybeSingle<Bolao>();
  return data;
}

// O front-end usa o /b/[code] — onde code é o join_code (UPPER) ou o slug.
// Esta função tenta ambos.
export async function getBolaoByCodeOrSlug(codeOrSlug: string): Promise<Bolao | null> {
  const byCode = await getBolaoByCode(codeOrSlug);
  if (byCode) return byCode;
  return getBolaoBySlug(codeOrSlug.toLowerCase());
}

// ------------------------------------------------------------
// Scoring config
// ------------------------------------------------------------

export async function getScoringConfig(bolaoId: string): Promise<ScoringConfig | null> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("scoring_config")
    .select("*")
    .eq("bolao_id", bolaoId)
    .maybeSingle<ScoringConfig>();
  return data;
}

// ------------------------------------------------------------
// Matches
// ------------------------------------------------------------

export async function getMatches(bolaoId: string): Promise<Match[]> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("matches")
    .select("*")
    .eq("bolao_id", bolaoId)
    .order("kickoff_at", { ascending: true })
    .returns<Match[]>();
  return data ?? [];
}

export async function getMatchById(matchId: string): Promise<Match | null> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle<Match>();
  return data;
}

export async function getNextMatch(bolaoId: string): Promise<Match | null> {
  const supabase = await supabaseServer();
  const nowIso = new Date().toISOString();
  const { data } = await supabase
    .from("matches")
    .select("*")
    .eq("bolao_id", bolaoId)
    .gte("kickoff_at", nowIso)
    .order("kickoff_at", { ascending: true })
    .limit(1)
    .maybeSingle<Match>();
  return data;
}

// ------------------------------------------------------------
// Members
// ------------------------------------------------------------

export async function getMembers(bolaoId: string): Promise<Member[]> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("members")
    .select("*")
    .eq("bolao_id", bolaoId)
    .order("created_at", { ascending: true })
    .returns<Member[]>();
  return data ?? [];
}

export async function getMember(memberId: string): Promise<Member | null> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("members")
    .select("*")
    .eq("id", memberId)
    .maybeSingle<Member>();
  return data;
}

// ------------------------------------------------------------
// Predictions
// ------------------------------------------------------------

export async function getPredictionsForBolao(bolaoId: string): Promise<Prediction[]> {
  const supabase = await supabaseServer();
  // join via match.bolao_id — Supabase suporta filtros em relações
  const { data } = await supabase
    .from("predictions")
    .select("*, match:matches!inner(bolao_id)")
    .eq("match.bolao_id", bolaoId)
    .returns<(Prediction & { match: { bolao_id: string } })[]>();
  return (data ?? []).map(({ match: _m, ...p }) => p as Prediction);
}

export async function getPredictionsForMember(memberId: string): Promise<Prediction[]> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("predictions")
    .select("*")
    .eq("member_id", memberId)
    .returns<Prediction[]>();
  return data ?? [];
}

// ------------------------------------------------------------
// Special picks
// ------------------------------------------------------------

export async function getSpecialPicksForBolao(bolaoId: string): Promise<SpecialPick[]> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("special_picks")
    .select("*, member:members!inner(bolao_id)")
    .eq("member.bolao_id", bolaoId)
    .returns<(SpecialPick & { member: { bolao_id: string } })[]>();
  return (data ?? []).map(({ member: _m, ...p }) => p as SpecialPick);
}

export async function getSpecialPicksForMember(memberId: string): Promise<SpecialPick[]> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("special_picks")
    .select("*")
    .eq("member_id", memberId)
    .returns<SpecialPick[]>();
  return data ?? [];
}

export async function getSpecialResults(bolaoId: string): Promise<SpecialResult[]> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("special_results")
    .select("*")
    .eq("bolao_id", bolaoId)
    .returns<SpecialResult[]>();
  return data ?? [];
}

// ------------------------------------------------------------
// Prediction distribution (para bônus zebra)
// ------------------------------------------------------------

export async function getPredictionDistribution(
  bolaoId: string
): Promise<PredictionDistribution[]> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("prediction_distribution")
    .select("*, match:matches!inner(bolao_id)")
    .eq("match.bolao_id", bolaoId)
    .returns<(PredictionDistribution & { match: { bolao_id: string } })[]>();
  return (data ?? []).map(({ match: _m, ...d }) => d as PredictionDistribution);
}

// ------------------------------------------------------------
// Ranking — compõe tudo
// ------------------------------------------------------------

export async function getRanking(bolaoId: string): Promise<RankingRow[]> {
  const [
    config,
    members,
    matches,
    predictions,
    specialPicks,
    specialResults,
    distribution,
  ] = await Promise.all([
    getScoringConfig(bolaoId),
    getMembers(bolaoId),
    getMatches(bolaoId),
    getPredictionsForBolao(bolaoId),
    getSpecialPicksForBolao(bolaoId),
    getSpecialResults(bolaoId),
    getPredictionDistribution(bolaoId),
  ]);

  if (!config) return [];
  return buildRanking(
    members,
    predictions,
    matches,
    specialPicks,
    specialResults,
    config,
    distribution
  );
}
