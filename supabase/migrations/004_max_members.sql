-- ============================================================
-- Migração 004 — Cap opcional de membros por bolão (anti-spam)
-- ============================================================
alter table bolao add column if not exists max_members int;
