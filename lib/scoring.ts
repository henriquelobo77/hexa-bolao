// ============================================================
// HEXA · Engine de pontuação
// ------------------------------------------------------------
// Pontuação por palpite é calculada determinísticamente a partir de:
//   - palpite (home_score, away_score)
//   - resultado oficial (official_home_score, official_away_score)
//   - fase e times do jogo (multiplicadores)
//   - distribuição de palpites no jogo (bônus zebra)
//   - config do bolão
//
// E também:
//   - palpites únicos (campeão, artilheiro, vice, semifinalistas)
//
// É tudo função pura — fácil de testar e de mudar regra no admin.
// ============================================================

import type {
  Match,
  Prediction,
  ScoringConfig,
  SpecialPick,
  SpecialResult,
  PredictionDistribution,
  RankingRow,
  Member,
} from "./types";

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

type ResultKind = "exato" | "empate_exato" | "vencedor" | "saldo" | "errado";

function classifyPrediction(
  pHome: number, pAway: number,
  oHome: number, oAway: number
): ResultKind {
  if (pHome === oHome && pAway === oAway) {
    return pHome === pAway ? "empate_exato" : "exato";
  }
  const palpiteVencedor = Math.sign(pHome - pAway);    // -1, 0, 1
  const oficialVencedor = Math.sign(oHome - oAway);
  if (palpiteVencedor !== oficialVencedor) return "errado";
  // Acertou o resultado (vencedor ou empate sem placar exato)
  if (palpiteVencedor === 0) return "vencedor"; // empate sem placar
  // Acertou o vencedor — bonus extra se acertou também o saldo
  if (pHome - pAway === oHome - oAway) return "saldo";
  return "vencedor";
}

function phaseMultiplier(match: Match, cfg: ScoringConfig): number {
  switch (match.phase) {
    case "r32":     return cfg.mult_r32;
    case "oitavas": return cfg.mult_oitavas;
    case "quartas": return cfg.mult_quartas;
    case "semi":    return cfg.mult_semi;
    case "final":   return cfg.mult_final;
    default:        return 1;
  }
}

function brasilMultiplier(match: Match, cfg: ScoringConfig): number {
  // Brasil 2× só vale na fase de grupos — mata-mata usa só mult de fase
  if (match.phase !== "grupos") return 1;
  if (match.team_home_code === "BRA" || match.team_away_code === "BRA") {
    return cfg.mult_brasil;
  }
  return 1;
}

// ------------------------------------------------------------
// Pontos por palpite individual
// ------------------------------------------------------------

export interface ScoredPrediction {
  match_id: string;
  member_id: string;
  base_points: number;
  multiplier: number;
  zebra_bonus: number;
  total_points: number;
  kind: ResultKind | "pendente";
  is_brazil: boolean;
  phase: Match["phase"];
}

export function scorePrediction(
  prediction: Prediction,
  match: Match,
  cfg: ScoringConfig,
  distribution?: PredictionDistribution[]
): ScoredPrediction {
  const isBrazil =
    match.team_home_code === "BRA" || match.team_away_code === "BRA";

  // Jogo ainda sem resultado oficial → pendente
  if (
    match.official_home_score === null ||
    match.official_away_score === null ||
    match.status !== "finished"
  ) {
    return {
      match_id: match.id,
      member_id: prediction.member_id,
      base_points: 0,
      multiplier: 1,
      zebra_bonus: 0,
      total_points: 0,
      kind: "pendente",
      is_brazil: isBrazil,
      phase: match.phase,
    };
  }

  const kind = classifyPrediction(
    prediction.home_score, prediction.away_score,
    match.official_home_score, match.official_away_score
  );

  let basePts = 0;
  switch (kind) {
    case "exato":         basePts = cfg.pts_placar_exato; break;
    case "empate_exato":  basePts = cfg.pts_placar_exato; break; // mesmo valor de placar exato
    case "saldo":         basePts = cfg.pts_vencedor + cfg.pts_saldo; break;
    case "vencedor":      basePts = cfg.pts_vencedor; break;
    case "errado":        basePts = 0; break;
  }

  // Mata-mata: quem passa
  // Placar oficial = resultado dos 120 minutos (90' + prorrogação se houve).
  // Bônus "quem passa" só vale quando o jogo foi DECIDIDO NOS PÊNALTIS
  // (= placar oficial empate). Em jogo definido em 90'/120', o vencedor
  // já é claro e o palpite ganha pelos pontos de vencedor/placar normais.
  const isKnockout = match.phase !== "grupos";
  const wentToPenalties =
    match.official_home_score === match.official_away_score;
  let quemPassaBonus = 0;
  if (
    isKnockout &&
    wentToPenalties &&
    match.official_advances_team_code &&
    prediction.advances_team_code === match.official_advances_team_code
  ) {
    quemPassaBonus = cfg.pts_quem_passa;
  }

  // Multiplicadores (combinam — Brasil 2x na semi 2.5x = 5x)
  const mult = brasilMultiplier(match, cfg) * phaseMultiplier(match, cfg);
  let zebra = 0;

  // Bônus zebra: se cravou o placar exato (incluindo empate) e no máximo N pessoas (padrão 1) o acertaram
  if (
    cfg.bonus_zebra_enabled &&
    (kind === "exato" || kind === "empate_exato") &&
    distribution
  ) {
    const hit = distribution.find(
      (d) =>
        d.match_id === match.id &&
        d.home_score === prediction.home_score &&
        d.away_score === prediction.away_score
    );
    if (hit && hit.n <= cfg.bonus_zebra_max_hits) {
      zebra = cfg.bonus_zebra_pts;
    }
  }

  const total = Math.round((basePts + quemPassaBonus) * mult + zebra);

  return {
    match_id: match.id,
    member_id: prediction.member_id,
    base_points: basePts,
    multiplier: mult,
    zebra_bonus: zebra,
    total_points: total,
    kind,
    is_brazil: isBrazil,
    phase: match.phase,
  };
}

// ------------------------------------------------------------
// Pontos dos palpites únicos (campeão, artilheiro etc.)
// ------------------------------------------------------------

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function scoreSpecialPicks(
  picks: SpecialPick[],
  results: SpecialResult[],
  cfg: ScoringConfig
): number {
  let total = 0;
  const resultsByKey = new Map(
    results.map((r) => [`${r.kind}#${r.position}`, normalize(r.value)])
  );

  for (const pick of picks) {
    const key = `${pick.kind}#${pick.position}`;
    const expected = resultsByKey.get(key);
    if (!expected) continue;
    if (normalize(pick.value) !== expected) continue;

    switch (pick.kind) {
      case "campeao":       total += cfg.pts_campeao; break;
      case "artilheiro":    total += cfg.pts_artilheiro; break;
      case "vice":          if (cfg.enable_vice) total += cfg.pts_vice; break;
      case "semifinalista": if (cfg.enable_semifinalistas) total += cfg.pts_semifinalista; break;
    }
  }
  return total;
}

// ------------------------------------------------------------
// Ranking completo (consome todos os palpites + resultados)
// ------------------------------------------------------------

export function buildRanking(
  members: Member[],
  predictions: Prediction[],
  matches: Match[],
  specialPicks: SpecialPick[],
  specialResults: SpecialResult[],
  cfg: ScoringConfig,
  distribution: PredictionDistribution[]
): RankingRow[] {
  const matchById = new Map(matches.map((m) => [m.id, m]));

  // Agrupar palpites por membro
  const predsByMember = new Map<string, Prediction[]>();
  for (const p of predictions) {
    if (!predsByMember.has(p.member_id)) predsByMember.set(p.member_id, []);
    predsByMember.get(p.member_id)!.push(p);
  }

  const picksByMember = new Map<string, SpecialPick[]>();
  for (const p of specialPicks) {
    if (!picksByMember.has(p.member_id)) picksByMember.set(p.member_id, []);
    picksByMember.get(p.member_id)!.push(p);
  }

  const rows: RankingRow[] = members.map((m) => {
    const preds = predsByMember.get(m.id) ?? [];
    let total = 0;
    let made = 0;

    for (const p of preds) {
      made++;
      const match = matchById.get(p.match_id);
      if (!match) continue;
      const scored = scorePrediction(p, match, cfg, distribution);
      total += scored.total_points;
    }

    total += scoreSpecialPicks(picksByMember.get(m.id) ?? [], specialResults, cfg);

    return {
      member_id: m.id,
      nickname: m.nickname,
      total_points: total,
      rank: 0, // será preenchido a seguir
      predictions_made: made,
    };
  });

  // Ordena por pontos desc, depois por mais palpites feitos
  rows.sort(
    (a, b) =>
      b.total_points - a.total_points ||
      b.predictions_made - a.predictions_made ||
      a.nickname.localeCompare(b.nickname)
  );

  // Atribui rank com empates compartilhando posição
  let lastPts = -Infinity;
  let lastRank = 0;
  rows.forEach((r, i) => {
    if (r.total_points !== lastPts) {
      lastRank = i + 1;
      lastPts = r.total_points;
    }
    r.rank = lastRank;
  });

  return rows;
}

// ------------------------------------------------------------
// Deadline de palpite (mantém em sync com o admin)
// ------------------------------------------------------------

export function isPredictionOpen(match: Match, cfg: ScoringConfig): boolean {
  if (match.status !== "scheduled") return false;
  const kickoff = new Date(match.kickoff_at).getTime();
  const deadline = kickoff - (cfg.predict_deadline_min ?? 0) * 60_000;
  return Date.now() < deadline;
}
