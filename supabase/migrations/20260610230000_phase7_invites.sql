-- ============================================================================
-- Fase 7: onboarding sin fricción + invitaciones con link/QR
--  - gen_username: "nombre.apellido" único (leonardo.jurado, leonardo.jurado2…)
--  - handle_new_user: autogenera el username si no llegó uno (Google directo,
--    sin pasar por /completar-perfil).
--  - get_pool_preview: nombre y nº de jugadores de una polla a partir de su
--    código (para la página pública de invitación; el código es la llave).
-- ============================================================================

create or replace function public.gen_username(p_first text, p_last text)
returns text language plpgsql as $$
declare
  base      text;
  candidate text;
  n         int := 1;
begin
  base := lower(trim(coalesce(p_first, '') || '.' || coalesce(p_last, '')));
  base := translate(base, 'áàäâãéèëêíìïîóòöôõúùüûñç', 'aaaaaeeeeiiiiooooouuuunc');
  base := regexp_replace(base, '[^a-z0-9.]+', '', 'g');
  base := trim(both '.' from regexp_replace(base, '\.{2,}', '.', 'g'));
  if base = '' then base := 'jugador'; end if;

  candidate := base;
  while exists (select 1 from public.profiles where username = candidate) loop
    n := n + 1;
    candidate := base || n::text;
  end loop;
  return candidate;
end;
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_full  text := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '');
  v_first text := coalesce(nullif(new.raw_user_meta_data->>'first_name', ''), nullif(split_part(v_full, ' ', 1), ''), '');
  v_last  text := coalesce(
    nullif(new.raw_user_meta_data->>'last_name', ''),
    nullif(trim(substr(v_full, length(split_part(v_full, ' ', 1)) + 2)), ''),
    ''
  );
begin
  insert into public.profiles (id, email, first_name, last_name, username, country, avatar_url)
  values (
    new.id,
    new.email,
    v_first,
    v_last,
    coalesce(nullif(trim(new.raw_user_meta_data->>'username'), ''), public.gen_username(v_first, v_last)),
    new.raw_user_meta_data->>'country',
    new.raw_user_meta_data->>'avatar_url'
  );
  insert into public.memberships (pool_id, user_id)
  values ('00000000-0000-0000-0000-000000000001', new.id);
  return new;
end;
$$;

create or replace function public.get_pool_preview(p_code text)
returns table (id uuid, name text, members bigint)
language sql security definer set search_path = public stable as $$
  select p.id,
         p.name,
         (select count(*) from public.memberships m where m.pool_id = p.id)
    from public.pools p
   where p.type = 'private' and upper(p.code) = upper(trim(p_code));
$$;
