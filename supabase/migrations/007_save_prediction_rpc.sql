-- ============================================================
-- Migração 007 — RPC save_prediction
-- ------------------------------------------------------------
-- Antes: 3 queries sequenciais (match + cfg + upsert) → ~600ms
-- Agora: 1 RPC atômico → ~150ms
-- ============================================================

create or replace function save_prediction(
  p_member_id uuid,
  p_match_id uuid,
  p_home_score int,
  p_away_score int,
  p_advances_team_code text default null
) returns void
language plpgsql
security definer
as $$
declare
  v_bolao_id uuid;
  v_kickoff timestamptz;
  v_status match_status;
  v_phase match_phase;
  v_home_code text;
  v_away_code text;
  v_deadline_min int;
  v_advances text := null;
begin
  -- Pega tudo do jogo numa query
  select bolao_id, kickoff_at, status, phase, team_home_code, team_away_code
    into v_bolao_id, v_kickoff, v_status, v_phase, v_home_code, v_away_code
    from matches where id = p_match_id;

  if v_bolao_id is null then
    raise exception 'Jogo não encontrado';
  end if;

  if v_status <> 'scheduled' then
    raise exception 'Palpites já fechados para esse jogo';
  end if;

  -- Deadline (lê só o campo necessário)
  select predict_deadline_min into v_deadline_min
    from scoring_config where bolao_id = v_bolao_id;

  if now() >= v_kickoff - (coalesce(v_deadline_min, 0) || ' minutes')::interval then
    raise exception 'Palpites já fechados para esse jogo';
  end if;

  -- Mata-mata com empate exige quem-passa
  if v_phase <> 'grupos' and p_home_score = p_away_score then
    if p_advances_team_code is null
       or p_advances_team_code not in (v_home_code, v_away_code) then
      raise exception 'Palpite de empate em mata-mata precisa indicar quem passa';
    end if;
    v_advances := p_advances_team_code;
  end if;

  -- Upsert
  insert into predictions (member_id, match_id, home_score, away_score, advances_team_code)
  values (p_member_id, p_match_id, p_home_score, p_away_score, v_advances)
  on conflict (member_id, match_id) do update set
    home_score = excluded.home_score,
    away_score = excluded.away_score,
    advances_team_code = excluded.advances_team_code,
    updated_at = now();
end;
$$;
