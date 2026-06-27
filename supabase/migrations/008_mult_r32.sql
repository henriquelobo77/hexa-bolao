-- ============================================================
-- 008 · Adiciona mult_r32 ao scoring_config
-- ------------------------------------------------------------
-- Multiplicador da fase Round of 32 (default 1, sem efeito).
-- Cada bolão pode ajustar via /admin/regras.
-- ============================================================

ALTER TABLE scoring_config
  ADD COLUMN IF NOT EXISTS mult_r32 numeric NOT NULL DEFAULT 1.0;
