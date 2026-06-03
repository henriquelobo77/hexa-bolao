-- ============================================================
-- Migração 001 — Bônus zebra agora é por contagem (não %)
-- ------------------------------------------------------------
-- Rode no SQL Editor do Supabase uma vez.
-- ============================================================

alter table scoring_config
  drop column if exists bonus_zebra_threshold;

alter table scoring_config
  add column if not exists bonus_zebra_max_hits int not null default 1;
