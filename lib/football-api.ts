// ============================================================
// HEXA · Cliente football-data.org
// ------------------------------------------------------------
// Documentação: https://www.football-data.org/documentation/api
//
// Tier free:
//   - 10 requests/minuto
//   - Limitado a 12 competições (incluindo FIFA World Cup, code "WC")
//   - Sem limite diário explícito (mas seja gentil)
//
// Auth: header X-Auth-Token
// ============================================================

import type { MatchPhase, MatchStatus } from "./types";

const BASE = "https://api.football-data.org/v4";
const COMPETITION = "WC"; // FIFA World Cup

// ------------------------------------------------------------
// Tipos do retorno da API (simplificado pro que usamos)
// ------------------------------------------------------------

interface ApiTeam {
  id: number | null;
  name: string | null;
  shortName: string | null;
  tla: string | null;
  crest: string | null;
}

interface ApiScore {
  winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
  duration: string;
  fullTime: { home: number | null; away: number | null };
  halfTime: { home: number | null; away: number | null };
}

interface ApiMatch {
  id: number;
  utcDate: string;
  status: string;
  matchday: number | null;
  stage: string;
  group: string | null;
  lastUpdated: string;
  homeTeam: ApiTeam;
  awayTeam: ApiTeam;
  score: ApiScore;
  venue?: string | null;
}

interface ApiResponse {
  filters?: Record<string, unknown>;
  resultSet?: { count: number };
  matches: ApiMatch[];
}

// ------------------------------------------------------------
// Erros
// ------------------------------------------------------------

export class FootballApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "FootballApiError";
  }
}

// ------------------------------------------------------------
// Fetcher
// ------------------------------------------------------------

async function apiFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "X-Auth-Token": token },
    // No-store: queremos dados frescos sempre
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new FootballApiError(
      `football-data.org ${res.status}: ${text.slice(0, 200)}`,
      res.status
    );
  }
  return res.json() as Promise<T>;
}

export async function fetchAllMatches(token: string): Promise<ApiMatch[]> {
  const data = await apiFetch<ApiResponse>(`/competitions/${COMPETITION}/matches`, token);
  return data.matches ?? [];
}

// ------------------------------------------------------------
// Mappers para o nosso schema
// ------------------------------------------------------------

const PHASE_MAP: Record<string, MatchPhase> = {
  GROUP_STAGE: "grupos",
  PRELIMINARY_ROUND: "grupos",
  LAST_32: "r32",
  ROUND_OF_32: "r32",
  LAST_16: "oitavas",
  ROUND_OF_16: "oitavas",
  QUARTER_FINALS: "quartas",
  QUARTER_FINAL: "quartas",
  SEMI_FINALS: "semi",
  SEMI_FINAL: "semi",
  THIRD_PLACE: "terceiro",
  PLAY_OFF_3RD_4TH: "terceiro",
  FINAL: "final",
};

const STATUS_MAP: Record<string, MatchStatus> = {
  SCHEDULED: "scheduled",
  TIMED: "scheduled",
  POSTPONED: "scheduled",
  SUSPENDED: "scheduled",
  IN_PLAY: "live",
  PAUSED: "live",
  LIVE: "live",
  FINISHED: "finished",
  AWARDED: "finished",
  CANCELLED: "cancelled",
};

function phaseFromStage(stage: string): MatchPhase {
  return PHASE_MAP[stage] ?? "grupos";
}

function statusFromApi(s: string): MatchStatus {
  return STATUS_MAP[s] ?? "scheduled";
}

function groupLetter(group: string | null): string | null {
  if (!group) return null;
  // API costuma mandar "GROUP_A" ou "Group A"
  const match = group.toUpperCase().match(/([A-L])\b/);
  return match ? match[1] : null;
}

function roundLabel(m: ApiMatch): string {
  const phase = phaseFromStage(m.stage);
  if (phase === "grupos" && m.group) {
    const letter = groupLetter(m.group) ?? "?";
    return `Grupo ${letter} · Rodada ${m.matchday ?? "?"}`;
  }
  switch (phase) {
    case "r32": return "Round of 32";
    case "oitavas": return "Oitavas de final";
    case "quartas": return "Quartas de final";
    case "semi": return "Semifinal";
    case "terceiro": return "Disputa 3º lugar";
    case "final": return "Final";
    default: return m.stage;
  }
}

function pickTeamCode(team: ApiTeam, fallback: string): string {
  return team.tla?.trim() || fallback;
}

function pickTeamName(team: ApiTeam): string {
  return team.shortName || team.name || "A definir";
}

// ------------------------------------------------------------
// Mapeamentos PT-BR para os nomes (sobrescreve o que vem da API)
// ------------------------------------------------------------
//
// A API devolve nomes em inglês ("Brazil", "Croatia"). Vamos
// substituir pelo nome em português do nosso dicionário quando
// tivermos um match pelo TLA.
import { teamNames } from "./fixtures";

function localizedName(team: ApiTeam, code: string): string {
  if (code && code !== "TBD" && teamNames[code]) {
    return teamNames[code];
  }
  return pickTeamName(team);
}

// ------------------------------------------------------------
// Mapa de saída — pronto pra dar upsert no Supabase
// ------------------------------------------------------------

export interface MappedMatch {
  external_id: string;
  phase: MatchPhase;
  group_letter: string | null;
  round_label: string;
  team_home_code: string;
  team_home_name: string;
  team_away_code: string;
  team_away_name: string;
  kickoff_at: string;
  venue: string | null;
  status: MatchStatus;
  official_home_score: number | null;
  official_away_score: number | null;
  order_index: number;
}

export function mapMatches(apiMatches: ApiMatch[]): MappedMatch[] {
  // Ordena cronologicamente pra preservar order_index estável
  const sorted = [...apiMatches].sort((a, b) =>
    a.utcDate.localeCompare(b.utcDate)
  );

  return sorted.map((m, i) => {
    const homeCode = pickTeamCode(m.homeTeam, "TBD");
    const awayCode = pickTeamCode(m.awayTeam, "TBD");
    const status = statusFromApi(m.status);
    const finished = status === "finished" || status === "live";
    return {
      external_id: String(m.id),
      phase: phaseFromStage(m.stage),
      group_letter: groupLetter(m.group),
      round_label: roundLabel(m),
      team_home_code: homeCode,
      team_home_name: localizedName(m.homeTeam, homeCode),
      team_away_code: awayCode,
      team_away_name: localizedName(m.awayTeam, awayCode),
      kickoff_at: m.utcDate,
      venue: m.venue ?? null,
      status,
      official_home_score: finished ? m.score.fullTime.home : null,
      official_away_score: finished ? m.score.fullTime.away : null,
      order_index: i,
    };
  });
}
