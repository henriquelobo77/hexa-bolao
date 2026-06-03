-- ============================================================
-- Migração 005 — PIN de 4-6 dígitos por membro
-- ------------------------------------------------------------
-- Cada membro cria um PIN na 1ª entrada. Em qualquer reentrada
-- (mesmo navegador limpo ou outro device), apelido + PIN são
-- exigidos. Hash bcrypt via pgcrypto. Admin pode resetar.
-- ============================================================

-- pgcrypto já habilitado no schema.sql; garantia idempotente:
create extension if not exists "pgcrypto";

-- Coluna do hash do PIN (NULL = ainda não criou; permite migração suave)
alter table members add column if not exists pin_hash text;

-- ------------------------------------------------------------
-- Função: criar novo membro com PIN
-- ------------------------------------------------------------
create or replace function create_member_with_pin(
  p_bolao_id uuid,
  p_nickname text,
  p_pin text
) returns uuid
language plpgsql
security definer
as $$
declare
  v_member_id uuid;
begin
  if p_pin !~ '^\d{4,6}$' then
    raise exception 'PIN deve ter 4 a 6 dígitos.';
  end if;

  insert into members (bolao_id, nickname, pin_hash)
  values (p_bolao_id, p_nickname, crypt(p_pin, gen_salt('bf', 10)))
  returning id into v_member_id;

  return v_member_id;
end;
$$;

-- ------------------------------------------------------------
-- Função: autenticar (verifica apelido + PIN)
-- Retorna o id do membro se válido, NULL se não.
-- ------------------------------------------------------------
create or replace function auth_member(
  p_bolao_id uuid,
  p_nickname text,
  p_pin text
) returns uuid
language plpgsql
security definer
as $$
declare
  v_member_id uuid;
  v_pin_hash text;
begin
  select id, pin_hash into v_member_id, v_pin_hash
  from members
  where bolao_id = p_bolao_id
    and lower(nickname) = lower(p_nickname);

  if v_member_id is null then
    return null; -- apelido não existe
  end if;

  if v_pin_hash is null then
    -- Legado sem PIN ou foi resetado: aceita esta entrada como nova
    -- definição (caller decide se cria PIN agora).
    return v_member_id;
  end if;

  if v_pin_hash = crypt(p_pin, v_pin_hash) then
    return v_member_id;
  end if;

  return null;
end;
$$;

-- ------------------------------------------------------------
-- Função: trocar PIN de um membro (usada no perfil)
-- ------------------------------------------------------------
create or replace function set_member_pin(
  p_member_id uuid,
  p_new_pin text
) returns void
language plpgsql
security definer
as $$
begin
  if p_new_pin !~ '^\d{4,6}$' then
    raise exception 'PIN deve ter 4 a 6 dígitos.';
  end if;

  update members
  set pin_hash = crypt(p_new_pin, gen_salt('bf', 10))
  where id = p_member_id;
end;
$$;

-- ------------------------------------------------------------
-- Função: resetar PIN (admin) — zera, força pessoa a criar de novo
-- ------------------------------------------------------------
create or replace function admin_reset_member_pin(p_member_id uuid)
returns void
language sql
security definer
as $$
  update members set pin_hash = null where id = p_member_id;
$$;
