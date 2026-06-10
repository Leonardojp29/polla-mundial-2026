-- ============================================================================
-- Fase 5: social + estadísticas
--  - Pronósticos de la polla visibles cuando el partido YA empezó (RLS + RPCs)
--  - get_leaderboard con avatar_url (foto de Google / iniciales en el ranking)
--  - Estadísticas agregadas de la polla (campeón más elegido, consenso, goleador)
-- ============================================================================

-- ---------- Ver pronósticos ajenos tras el kickoff ----------
-- Antes del inicio nadie puede copiarse; al arrancar el partido se abren.
create policy predictions_select_pool_started on public.predictions
  for select to authenticated
  using (
    public.is_pool_member(pool_id)
    and exists (
      select 1 from public.matches m
      where m.id = match_id and m.kickoff_at is not null and m.kickoff_at <= now()
    )
  );

-- ---------- Leaderboard con avatar ----------
-- Cambia el tipo de retorno (nueva columna avatar_url) → hay que recrearla.
drop function if exists public.get_leaderboard(uuid);
create function public.get_leaderboard(p_pool_id uuid)
returns table (user_id uuid, display_name text, avatar_url text, points bigint, predictions_count bigint)
language plpgsql security definer set search_path = public stable as $$
begin
  if not public.is_pool_member(p_pool_id) then
    raise exception 'No eres miembro de esta polla';
  end if;
  return query
    select
      pr.id,
      coalesce(nullif(trim(pr.first_name || ' ' || pr.last_name), ''), pr.username, split_part(pr.email, '@', 1)),
      pr.avatar_url,
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
    order by 4 desc, 5 desc;
end;
$$;

-- ---------- Pronósticos de un partido ya iniciado (con nombres) ----------
create or replace function public.get_match_predictions(p_pool_id uuid, p_match_id bigint)
returns table (user_id uuid, display_name text, avatar_url text, pred_home int, pred_away int, points int)
language plpgsql security definer set search_path = public stable as $$
begin
  if not public.is_pool_member(p_pool_id) then
    raise exception 'No eres miembro de esta polla';
  end if;
  if not exists (
    select 1 from public.matches m
    where m.id = p_match_id and m.kickoff_at is not null and m.kickoff_at <= now()
  ) then
    raise exception 'El partido aún no empieza';
  end if;
  return query
    select pr.id,
           coalesce(nullif(trim(pr.first_name || ' ' || pr.last_name), ''), pr.username, split_part(pr.email, '@', 1)),
           pr.avatar_url,
           p.pred_home_score,
           p.pred_away_score,
           p.points_awarded
      from public.predictions p
      join public.profiles pr on pr.id = p.user_id
     where p.pool_id = p_pool_id and p.match_id = p_match_id
     order by p.points_awarded desc nulls last, 2 asc;
end;
$$;

-- ---------- Desglose de puntos de un jugador (solo partidos ya iniciados) ----------
create or replace function public.get_player_breakdown(p_pool_id uuid, p_user_id uuid)
returns table (
  match_id bigint, stage text, group_letter text, kickoff_at timestamptz, status text,
  home_name text, home_flag text, away_name text, away_flag text,
  home_score int, away_score int, pred_home int, pred_away int, points int
)
language plpgsql security definer set search_path = public stable as $$
begin
  if not public.is_pool_member(p_pool_id) then
    raise exception 'No eres miembro de esta polla';
  end if;
  return query
    select m.id, m.stage::text, m.group_letter, m.kickoff_at, m.status::text,
           coalesce(th.name, m.home_label, '—'), th.flag_code,
           coalesce(ta.name, m.away_label, '—'), ta.flag_code,
           m.home_score, m.away_score,
           p.pred_home_score, p.pred_away_score, p.points_awarded
      from public.predictions p
      join public.matches m on m.id = p.match_id
      left join public.teams th on th.id = m.home_team_id
      left join public.teams ta on ta.id = m.away_team_id
     where p.pool_id = p_pool_id and p.user_id = p_user_id
       and m.kickoff_at is not null and m.kickoff_at <= now()
     order by m.kickoff_at desc;
end;
$$;

-- ---------- Estadísticas agregadas de la polla ----------
-- Solo agregados (cuántos van por cada campeón/goleador): no expone elecciones
-- individuales antes del cierre.
create or replace function public.get_pool_stats(p_pool_id uuid)
returns jsonb
language plpgsql security definer set search_path = public stable as $$
declare v jsonb;
begin
  if not public.is_pool_member(p_pool_id) then
    raise exception 'No eres miembro de esta polla';
  end if;
  select jsonb_build_object(
    'members', (select count(*) from public.memberships where pool_id = p_pool_id),
    'with_special', (select count(*) from public.special_predictions sp
                      where sp.pool_id = p_pool_id and sp.champion_team_id is not null),
    'champions', coalesce((
      select jsonb_agg(jsonb_build_object('name', t.name, 'flag', t.flag_code, 'n', c.n) order by c.n desc, t.name)
      from (
        select champion_team_id as tid, count(*) as n
        from public.special_predictions
        where pool_id = p_pool_id and champion_team_id is not null
        group by champion_team_id
      ) c join public.teams t on t.id = c.tid
    ), '[]'::jsonb),
    'top_scorers', coalesce((
      select jsonb_agg(jsonb_build_object('name', s.nm, 'n', s.n) order by s.n desc, s.nm)
      from (
        select initcap(trim(top_scorer_name)) as nm, count(*) as n
        from public.special_predictions
        where pool_id = p_pool_id and nullif(trim(top_scorer_name), '') is not null
        group by 1
        order by 2 desc
        limit 8
      ) s
    ), '[]'::jsonb)
  ) into v;
  return v;
end;
$$;

-- ---------- Consenso por partido (gana local / empate / gana visita) ----------
create or replace function public.get_pool_consensus(p_pool_id uuid)
returns table (match_id bigint, home_n int, draw_n int, away_n int, top_score text, total int)
language plpgsql security definer set search_path = public stable as $$
begin
  if not public.is_pool_member(p_pool_id) then
    raise exception 'No eres miembro de esta polla';
  end if;
  return query
    select p.match_id,
           (count(*) filter (where p.pred_home_score > p.pred_away_score))::int,
           (count(*) filter (where p.pred_home_score = p.pred_away_score))::int,
           (count(*) filter (where p.pred_home_score < p.pred_away_score))::int,
           mode() within group (order by (p.pred_home_score || '–' || p.pred_away_score)),
           count(*)::int
      from public.predictions p
     where p.pool_id = p_pool_id
     group by p.match_id;
end;
$$;
