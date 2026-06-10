-- ============================================================================
-- Fase 4: eliminatorias + pronóstico maestro
--  - tournament_facts: hechos del torneo (goleador real)
--  - set_match_teams: el admin asigna equipos a los cruces al cerrar cada ronda
--  - recalc_special_points: puntúa los pronósticos maestros con lo decidido
--    hasta el momento (grupos completos, semifinalistas, final, goleador)
-- ============================================================================

create table public.tournament_facts (
  id              boolean primary key default true check (id),
  top_scorer_name text,
  updated_at      timestamptz not null default now()
);
insert into public.tournament_facts (id) values (true);

alter table public.tournament_facts enable row level security;
create policy facts_select on public.tournament_facts for select to authenticated using (true);

-- ---------- Asignar equipos a un cruce de eliminatorias ----------
create or replace function public.set_match_teams(p_match_id bigint, p_home text, p_away text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Solo administradores';
  end if;
  if p_home = p_away then
    raise exception 'Los dos equipos no pueden ser el mismo';
  end if;
  update public.matches
     set home_team_id = p_home, away_team_id = p_away
   where id = p_match_id and stage <> 'group';
  if not found then
    raise exception 'Cruce no encontrado (o es de fase de grupos)';
  end if;
end;
$$;

-- ---------- Recalcular puntos del pronóstico maestro ----------
-- Puntúa progresivamente: solo los hechos ya decididos suman.
-- Desempate de grupos: puntos > dif. de gol > goles a favor (criterio FIFA principal).
create or replace function public.recalc_special_points(p_top_scorer text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_semis    text[];
  v_champion text;
  v_runner   text;
  v_scorer   text;
  r          record;
  g          record;
  v_pts      int;
  v_n        int;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Solo administradores';
  end if;

  if p_top_scorer is not null then
    update public.tournament_facts
       set top_scorer_name = nullif(trim(p_top_scorer), ''), updated_at = now()
     where id = true;
  end if;
  select top_scorer_name into v_scorer from public.tournament_facts where id = true;

  -- Semifinalistas reales: equipos presentes en los partidos de semifinal.
  select array_agg(distinct t) into v_semis from (
    select home_team_id as t from public.matches where stage = 'sf' and home_team_id is not null
    union
    select away_team_id from public.matches where stage = 'sf' and away_team_id is not null
  ) s;

  -- Campeón y subcampeón: de la final terminada.
  select winner_team_id,
         case when winner_team_id = home_team_id then away_team_id else home_team_id end
    into v_champion, v_runner
    from public.matches
   where stage = 'final' and status = 'finished' and winner_team_id is not null;

  -- Posiciones reales de grupos COMPLETOS (6 partidos finalizados).
  create temp table tmp_ranked on commit drop as
  with gm as (
    select * from public.matches where stage = 'group' and status = 'finished'
  ),
  complete_groups as (
    select group_letter from gm group by group_letter having count(*) = 6
  ),
  stats as (
    select team, group_letter, sum(pts) as pts, sum(gf) - sum(ga) as gd, sum(gf) as gf
    from (
      select group_letter, home_team_id as team,
             case when home_score > away_score then 3 when home_score = away_score then 1 else 0 end as pts,
             home_score as gf, away_score as ga
        from gm
      union all
      select group_letter, away_team_id,
             case when away_score > home_score then 3 when home_score = away_score then 1 else 0 end,
             away_score, home_score
        from gm
    ) x
    group by team, group_letter
  )
  select *, row_number() over (partition by group_letter order by pts desc, gd desc, gf desc, team) as pos
    from stats
   where group_letter in (select group_letter from complete_groups);

  for r in
    select sp.id as sp_id, sp.*, pl.scoring_rules as rules
      from public.special_predictions sp
      join public.pools pl on pl.id = sp.pool_id
  loop
    v_pts := 0;

    -- 1.º y 2.º de cada grupo completo
    if r.group_winners is not null then
      for g in select * from tmp_ranked where pos <= 2 loop
        if g.pos = 1 and r.group_winners -> g.group_letter ->> 'first' = g.team then
          v_pts := v_pts + coalesce((r.rules -> 'special' ->> 'group_winner')::int, 3);
        end if;
        if g.pos = 2 and r.group_winners -> g.group_letter ->> 'second' = g.team then
          v_pts := v_pts + coalesce((r.rules -> 'special' ->> 'group_runner_up')::int, 2);
        end if;
      end loop;
    end if;

    -- Semifinalistas (cada acierto suma, sin importar el orden)
    if v_semis is not null and r.semifinalist_team_ids is not null then
      select count(*) into v_n
        from unnest(r.semifinalist_team_ids) as s
       where s = any (v_semis);
      v_pts := v_pts + v_n * coalesce((r.rules -> 'special' ->> 'semifinalist')::int, 8);
    end if;

    -- Campeón y subcampeón
    if v_champion is not null and r.champion_team_id = v_champion then
      v_pts := v_pts + coalesce((r.rules -> 'special' ->> 'champion')::int, 25);
    end if;
    if v_runner is not null and r.runner_up_team_id = v_runner then
      v_pts := v_pts + coalesce((r.rules -> 'special' ->> 'runner_up')::int, 15);
    end if;

    -- Goleador (comparación laxa por nombre)
    if v_scorer is not null and r.top_scorer_name is not null
       and lower(trim(r.top_scorer_name)) = lower(trim(v_scorer)) then
      v_pts := v_pts + coalesce((r.rules -> 'special' ->> 'top_scorer')::int, 15);
    end if;

    update public.special_predictions set points_awarded = v_pts where id = r.sp_id;
  end loop;

  drop table if exists tmp_ranked;
end;
$$;
