// ============================================================
// HEXA · Tipos compartilhados (refletem o schema)
// ============================================================

import type { MatchPhase } from "./fixtures";

export type { MatchPhase };
export type MatchStatus = "scheduled" | "live" | "finished" | "cancelled";
export type PickKind = "campeao" | "artilheiro" | "vice" | "semifinalista";

export interface Bolao {
  id: string;
  slug: string;
  name: string;
  join_code: string;
  starts_at: string;
  ends_at: string;
  max_members: number | null;
  created_at: string;
}

export interface ScoringConfig {
  bolao_id: string;
  pts_placar_exato: number;
  pts_vencedor: number;
  pts_saldo: number;
  pts_quem_passa: number;
  mult_brasil: number;
  mult_oitavas: number;
  mult_quartas: number;
  mult_semi: number;
  mult_final: number;
  bonus_zebra_enabled: boolean;
  bonus_zebra_max_hits: number;
  bonus_zebra_pts: number;
  pts_campeao: number;
  pts_artilheiro: number;
  enable_vice: boolean;
  pts_vice: number;
  enable_semifinalistas: boolean;
  pts_semifinalista: number;
  predict_deadline_min: number;
  updated_at: string;
}

export interface Member {
  id: string;
  bolao_id: string;
  nickname: string;
  pin_hash: string | null;
  created_at: string;
  last_seen_at: string;
}

export interface Match {
  id: string;
  bolao_id: string;
  external_id: string | null;
  phase: MatchPhase;
  group_letter: string | null;
  round_label: string | null;
  team_home_code: string;
  team_home_name: string;
  team_away_code: string;
  team_away_name: string;
  kickoff_at: string;
  venue: string | null;
  official_home_score: number | null;
  official_away_score: number | null;
  official_advances_team_code: string | null;
  status: MatchStatus;
  order_index: number;
  created_at: string;
}

export interface Prediction {
  id: string;
  member_id: string;
  match_id: string;
  home_score: number;
  away_score: number;
  advances_team_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface SpecialPick {
  id: string;
  member_id: string;
  kind: PickKind;
  value: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface SpecialResult {
  bolao_id: string;
  kind: PickKind;
  value: string;
  position: number;
  updated_at: string;
}

// ------------------------------------------------------------
// Tipos compostos usados nas páginas
// ------------------------------------------------------------

export interface RankingRow {
  member_id: string;
  nickname: string;
  total_points: number;
  rank: number;
  predictions_made: number;
}

export interface PredictionDistribution {
  match_id: string;
  home_score: number;
  away_score: number;
  n: number;
  share: number;
}
