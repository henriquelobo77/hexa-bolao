-- ============================================================
-- Migração 003 — Habilita Supabase Realtime
-- ------------------------------------------------------------
-- Permite que clientes recebam eventos de INSERT/UPDATE/DELETE
-- nas tabelas chave via WebSocket. Usado pra atualizar o ranking
-- ao vivo quando um resultado é lançado.
-- ============================================================

-- Garante que a publication existe
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

-- Adiciona as tabelas (idempotente)
alter publication supabase_realtime add table matches;
alter publication supabase_realtime add table predictions;
alter publication supabase_realtime add table special_results;
alter publication supabase_realtime add table special_picks;
alter publication supabase_realtime add table scoring_config;
