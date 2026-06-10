-- ============================================================================
-- Fase 3 + Rendimiento
--  - Resultados de partidos (solo admin) con recálculo automático de puntos
--  - get_leaderboard reescrito: 1 sola consulta agregada (antes: subqueries por fila)
--  - Trigger de alta compatible con Google OAuth (full_name / avatar_url)
--  - Lectura anónima de teams/matches (datos públicos → cacheables sin cookies)
-- ============================================================================

-- ---------- Datos públicos cacheables ----------
create policy teams_select_anon   on public.teams   for select to anon using (true);
create policy matches_select_anon on public.matches for select to anon using (true);

-- ---------- Alta de usuario: soporta email+password y Google ----------
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
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'country',
    new.raw_user_meta_data->>'avatar_url'
  );
  insert into public.memberships (pool_id, user_id)
  values ('00000000-0000-0000-0000-000000000001', new.id);
  return new;
end;
$$;

-- ---------- Leaderboard optimizado: agregación en una sola pasada ----------
create or replace function public.get_leaderboard(p_pool_id uuid)
returns table (user_id uuid, display_name text, points bigint, predictions_count bigint)
language plpgsql security definer set search_path = public stable as $$
begin
  if not public.is_pool_member(p_pool_id) then
    raise exception 'No eres miembro de esta polla';
  end if;
  return query
    select
      pr.id,
      coalesce(nullif(trim(pr.first_name || ' ' || pr.last_name), ''), pr.username, split_part(pr.email, '@', 1)),
      coalesce(p.pts, 0) + coalesce(sp.pts, 0),
      coalesce(p.cnt, 0)
    from public.memberships m
    join public.profiles pr on pr.id = m.user_id
    left join (
      select pd.user_id as uid, sum(coalesce(pd.points_awarded, 0)) as pts, count(*) as cnt
      from public.predictions pd
      where pd.pool_id = p_pool_id
      group by pd.user_id
    ) p on p.uid = pr.id
    left join (
      select s.user_id as uid, sum(coalesce(s.points_awarded, 0)) as pts
      from public.special_predictions s
      where s.pool_id = p_pool_id
      group by s.user_id
    ) sp on sp.uid = pr.id
    where m.pool_id = p_pool_id
    order by 3 desc, 4 desc;
end;
$$;

-- ---------- Resultado de partido (solo admin) + recálculo de puntos ----------
create or replace function public.set_match_result(p_match_id bigint, p_home int, p_away int)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_stage text;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Solo administradores pueden cargar resultados';
  end if;
  if p_home is null or p_away is null or p_home < 0 or p_away < 0 then
    raise exception 'Marcador inválido';
  end if;

  update public.matches
     set home_score = p_home,
         away_score = p_away,
         status = 'finished',
         winner_team_id = case
           when p_home > p_away then home_team_id
           when p_away > p_home then away_team_id
           else null
         end
   where id = p_match_id
   returning stage::text into v_stage;

  if v_stage is null then
    raise exception 'Partido no encontrado';
  end if;

  -- Recalcular puntos de TODAS las predicciones de este partido,
  -- respetando las reglas de puntaje propias de cada polla.
  update public.predictions p
     set points_awarded = case
       when p.pred_home_score = p_home and p.pred_away_score = p_away
         then coalesce((pl.scoring_rules -> v_stage ->> 'exact')::int, 5)
       when sign(p.pred_home_score - p.pred_away_score) = sign(p_home - p_away)
         then coalesce((pl.scoring_rules -> v_stage ->> 'result')::int, 3)
       else 0
     end
    from public.pools pl
   where p.match_id = p_match_id
     and pl.id = p.pool_id;
end;
$$;

-- Corrección: reabrir un partido (borra resultado y puntos otorgados).
create or replace function public.clear_match_result(p_match_id bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Solo administradores pueden cargar resultados';
  end if;
  update public.matches
     set home_score = null, away_score = null, status = 'scheduled', winner_team_id = null
   where id = p_match_id;
  update public.predictions set points_awarded = null where match_id = p_match_id;
end;
$$;
