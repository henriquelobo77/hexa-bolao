// ============================================================
// HEXA · Database types
// ------------------------------------------------------------
// Tipos manuais (sem supabase gen types). Mantém em sync com
// supabase/schema.sql.
// ============================================================

import type { MatchPhase, MatchStatus, PickKind } from "./types";

type BolaoRow = {
  id: string;
  slug: string;
  name: string;
  join_code: string;
  admin_password: string;
  starts_at: string;
  ends_at: string;
  max_members: number | null;
  created_at: string;
};

type ScoringConfigRow = {
  bolao_id: string;
  pts_placar_exato: number;
  pts_empate_exato: number;
  pts_vencedor: number;
  pts_saldo: number;
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
};

type MemberRow = {
  id: string;
  bolao_id: string;
  nickname: string;
  pin_hash: string | null;
  created_at: string;
  last_seen_at: string;
};

type MatchRow = {
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
  status: MatchStatus;
  order_index: number;
  created_at: string;
};

type PredictionRow = {
  id: string;
  member_id: string;
  match_id: string;
  home_score: number;
  away_score: number;
  created_at: string;
  updated_at: string;
};

type SpecialPickRow = {
  id: string;
  member_id: string;
  kind: PickKind;
  value: string;
  position: number;
  created_at: string;
  updated_at: string;
};

type SpecialResultRow = {
  bolao_id: string;
  kind: PickKind;
  value: string;
  position: number;
  updated_at: string;
};

type PredictionDistributionView = {
  match_id: string;
  home_score: number;
  away_score: number;
  n: number;
  share: number;
};

// Insert: ids e timestamps são opcionais (defaults no banco)
type InsertOf<T, Required extends keyof T> = Partial<T> & Pick<T, Required>;

type Rel = never[];

export interface Database {
  public: {
    Tables: {
      bolao: {
        Row: BolaoRow;
        Insert: InsertOf<BolaoRow, "slug" | "name" | "join_code" | "admin_password">;
        Update: Partial<BolaoRow>;
        Relationships: Rel;
      };
      scoring_config: {
        Row: ScoringConfigRow;
        Insert: InsertOf<ScoringConfigRow, "bolao_id">;
        Update: Partial<ScoringConfigRow>;
        Relationships: Rel;
      };
      members: {
        Row: MemberRow;
        Insert: InsertOf<MemberRow, "bolao_id" | "nickname">;
        Update: Partial<MemberRow>;
        Relationships: Rel;
      };
      matches: {
        Row: MatchRow;
        Insert: InsertOf<
          MatchRow,
          | "bolao_id"
          | "phase"
          | "team_home_code"
          | "team_home_name"
          | "team_away_code"
          | "team_away_name"
          | "kickoff_at"
        >;
        Update: Partial<MatchRow>;
        Relationships: Rel;
      };
      predictions: {
        Row: PredictionRow;
        Insert: InsertOf<PredictionRow, "member_id" | "match_id" | "home_score" | "away_score">;
        Update: Partial<PredictionRow>;
        Relationships: Rel;
      };
      special_picks: {
        Row: SpecialPickRow;
        Insert: InsertOf<SpecialPickRow, "member_id" | "kind" | "value">;
        Update: Partial<SpecialPickRow>;
        Relationships: Rel;
      };
      special_results: {
        Row: SpecialResultRow;
        Insert: InsertOf<SpecialResultRow, "bolao_id" | "kind" | "value">;
        Update: Partial<SpecialResultRow>;
        Relationships: Rel;
      };
    };
    Views: {
      prediction_distribution: {
        Row: PredictionDistributionView;
        Relationships: Rel;
      };
    };
    Functions: {
      create_member_with_pin: {
        Args: { p_bolao_id: string; p_nickname: string; p_pin: string };
        Returns: string;
      };
      auth_member: {
        Args: { p_bolao_id: string; p_nickname: string; p_pin: string };
        Returns: string | null;
      };
      set_member_pin: {
        Args: { p_member_id: string; p_new_pin: string };
        Returns: void;
      };
      admin_reset_member_pin: {
        Args: { p_member_id: string };
        Returns: void;
      };
    };
    Enums: {
      match_phase: MatchPhase;
      match_status: MatchStatus;
      pick_kind: PickKind;
    };
    CompositeTypes: Record<string, never>;
  };
}
