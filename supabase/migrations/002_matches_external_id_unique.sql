-- ============================================================
-- Migração 002 — Unique constraint em (bolao_id, external_id)
-- ------------------------------------------------------------
-- Necessário pro npm run sync conseguir fazer upsert por
-- external_id (id do jogo na API football-data.org).
-- ============================================================

alter table matches
  drop constraint if exists matches_bolao_external_unique;

alter table matches
  add constraint matches_bolao_external_unique
  unique (bolao_id, external_id);
