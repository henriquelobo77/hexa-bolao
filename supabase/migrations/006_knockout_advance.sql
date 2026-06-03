-- ============================================================
-- Migração 006 — Mata-mata: empate + quem passa, e removendo
-- a distinção do empate cravado valer mais.
-- ============================================================

-- 1. Empate cravado paga igual ao placar exato — remove o campo
alter table scoring_config drop column if exists pts_empate_exato;

-- 2. Novo campo: pontos extras por acertar quem passa em mata-mata
alter table scoring_config
  add column if not exists pts_quem_passa int not null default 5;

-- 3. Em cada palpite, qual seleção o usuário acha que avança
alter table predictions add column if not exists advances_team_code text;

-- 4. No jogo oficial, qual seleção realmente avançou (admin lança)
alter table matches add column if not exists official_advances_team_code text;
