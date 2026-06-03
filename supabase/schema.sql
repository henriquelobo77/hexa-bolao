-- ============================================================
-- HEXA · Bolão Copa 2026 — Schema
-- Run this in the Supabase SQL Editor (or via psql).
-- Idempotente: pode rodar várias vezes sem quebrar.
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- Tipos enumerados
-- ============================================================
do $$ begin
  create type match_phase as enum (
    'grupos', 'r32', 'oitavas', 'quartas', 'semi', 'terceiro', 'final'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type match_status as enum ('scheduled', 'live', 'finished', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type pick_kind as enum ('campeao', 'artilheiro', 'vice', 'semifinalista');
exception when duplicate_object then null; end $$;

-- ============================================================
-- Tabela: bolao
-- ============================================================
create table if not exists bolao (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  join_code text unique not null,
  admin_password text not null,
  starts_at timestamptz not null default '2026-06-11 16:00:00-03',
  ends_at timestamptz not null default '2026-07-19 17:00:00-03',
  max_members int,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Tabela: scoring_config (1 por bolão)
-- ============================================================
create table if not exists scoring_config (
  bolao_id uuid primary key references bolao(id) on delete cascade,

  -- Pontuação por jogo
  pts_placar_exato       int not null default 10,
  pts_empate_exato       int not null default 12,
  pts_vencedor           int not null default 5,
  pts_saldo              int not null default 3,

  -- Multiplicadores
  mult_brasil            numeric not null default 2.0,
  mult_oitavas           numeric not null default 1.5,
  mult_quartas           numeric not null default 2.0,
  mult_semi              numeric not null default 2.5,
  mult_final             numeric not null default 3.0,

  -- Bônus zebra (só quem cravou — até N pessoas com o mesmo placar exato)
  bonus_zebra_enabled    boolean not null default true,
  bonus_zebra_max_hits   int not null default 1,
  bonus_zebra_pts        int not null default 5,

  -- Palpites únicos
  pts_campeao            int not null default 50,
  pts_artilheiro         int not null default 30,
  enable_vice            boolean not null default false,
  pts_vice               int not null default 20,
  enable_semifinalistas  boolean not null default false,
  pts_semifinalista      int not null default 10,

  -- Deadline (minutos antes do apito; 0 = no apito)
  predict_deadline_min   int not null default 0,

  updated_at timestamptz not null default now()
);

-- ============================================================
-- Tabela: members (apelido + cookie, sem auth)
-- ============================================================
create table if not exists members (
  id uuid primary key default uuid_generate_v4(),
  bolao_id uuid not null references bolao(id) on delete cascade,
  nickname text not null,
  pin_hash text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (bolao_id, nickname)
);

create index if not exists idx_members_bolao on members(bolao_id);

-- ============================================================
-- Tabela: matches
-- ============================================================
create table if not exists matches (
  id uuid primary key default uuid_generate_v4(),
  bolao_id uuid not null references bolao(id) on delete cascade,

  external_id text,
  phase match_phase not null,
  group_letter text,
  round_label text,                    -- "Rodada 1", "Oitavas A1xB2", etc.

  team_home_code text not null,        -- "BRA"
  team_home_name text not null,        -- "Brasil"
  team_away_code text not null,
  team_away_name text not null,

  kickoff_at timestamptz not null,
  venue text,

  official_home_score int,
  official_away_score int,
  status match_status not null default 'scheduled',

  order_index int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_matches_bolao_kickoff on matches(bolao_id, kickoff_at);
create index if not exists idx_matches_bolao_phase on matches(bolao_id, phase);

-- Unique p/ permitir upsert por external_id no sync com a API
do $$ begin
  alter table matches add constraint matches_bolao_external_unique unique (bolao_id, external_id);
exception when duplicate_object then null; end $$;

-- ============================================================
-- Tabela: predictions
-- ============================================================
create table if not exists predictions (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid not null references members(id) on delete cascade,
  match_id uuid not null references matches(id) on delete cascade,
  home_score int not null check (home_score >= 0),
  away_score int not null check (away_score >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id, match_id)
);

create index if not exists idx_predictions_match on predictions(match_id);
create index if not exists idx_predictions_member on predictions(member_id);

-- ============================================================
-- Tabela: special_picks (palpites únicos do membro)
-- ============================================================
create table if not exists special_picks (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid not null references members(id) on delete cascade,
  kind pick_kind not null,
  value text not null,
  position int not null default 1,        -- 1..4 (relevante p/ semifinalista)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id, kind, position)
);

create index if not exists idx_special_picks_member on special_picks(member_id);

-- ============================================================
-- Tabela: special_results (oficial, lançado pelo admin)
-- ============================================================
create table if not exists special_results (
  bolao_id uuid not null references bolao(id) on delete cascade,
  kind pick_kind not null,
  value text not null,
  position int not null default 1,
  updated_at timestamptz not null default now(),
  primary key (bolao_id, kind, position)
);

-- ============================================================
-- View: contagem de palpites idênticos por jogo (para bônus zebra)
-- ============================================================
create or replace view prediction_distribution as
select
  p.match_id,
  p.home_score,
  p.away_score,
  count(*) as n,
  count(*)::numeric / nullif(
    (select count(*) from predictions p2 where p2.match_id = p.match_id), 0
  ) as share
from predictions p
group by p.match_id, p.home_score, p.away_score;

-- ============================================================
-- View: ranking total por membro (calculado em código no app;
-- esta view é só pra consultas ad-hoc)
-- ============================================================
-- Pontuação real é calculada em lib/scoring.ts (configurável por bolão).

-- ============================================================
-- Funções utilitárias
-- ============================================================
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_predictions_touch on predictions;
create trigger trg_predictions_touch
  before update on predictions
  for each row execute function touch_updated_at();

drop trigger if exists trg_special_picks_touch on special_picks;
create trigger trg_special_picks_touch
  before update on special_picks
  for each row execute function touch_updated_at();

drop trigger if exists trg_scoring_touch on scoring_config;
create trigger trg_scoring_touch
  before update on scoring_config
  for each row execute function touch_updated_at();

-- ============================================================
-- Row Level Security
-- (MVP: leitura aberta, escrita via service_role nas Server Actions)
-- ============================================================
alter table bolao enable row level security;
alter table scoring_config enable row level security;
alter table members enable row level security;
alter table matches enable row level security;
alter table predictions enable row level security;
alter table special_picks enable row level security;
alter table special_results enable row level security;

-- Leitura pública (vamos servir via anon key)
do $$ begin
  create policy bolao_read on bolao for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy scoring_read on scoring_config for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy members_read on members for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy matches_read on matches for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy predictions_read on predictions for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy special_picks_read on special_picks for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy special_results_read on special_results for select using (true);
exception when duplicate_object then null; end $$;

-- Escrita é feita exclusivamente via Server Actions usando a service_role key,
-- que ignora RLS — então nenhuma policy de INSERT/UPDATE/DELETE pública é necessária.
