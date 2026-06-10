-- ============================================================================
-- Fase 6: hub + rendimiento + push
--  - Consenso/stats de la POLLA GLOBAL accesibles sin sesión (cacheables y
--    para la landing pública); las pollas privadas siguen solo para miembros.
--  - top_scorers: tabla de goleadores reales (la llena el sync).
--  - get_pool_timeline: evolución de puntos por jugador y día (gráfico).
--  - push_subscriptions: suscripciones Web Push por usuario.
-- ============================================================================

-- ---------- Polla Global: agregados públicos ----------
create or replace function public.get_pool_stats(p_pool_id uuid)
returns jsonb
language plpgsql security definer set search_path = public stable as $$
declare v jsonb;
begin
  if not (p_pool_id = '00000000-0000-0000-0000-000000000001'
          or public.is_pool_member(p_pool_id)) then
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

create or replace function public.get_pool_consensus(p_pool_id uuid)
returns table (match_id bigint, home_n int, draw_n int, away_n int, top_score text, total int)
language plpgsql security definer set search_path = public stable as $$
begin
  if not (p_pool_id = '00000000-0000-0000-0000-000000000001'
          or public.is_pool_member(p_pool_id)) then
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

-- ---------- Goleadores reales (los llena el sync con la service role) ----------
create table public.top_scorers (
  player_id   int primary key,
  player_name text not null,
  team_name   text,
  flag_code   text,
  goals       int not null default 0,
  assists     int,
  penalties   int,
  updated_at  timestamptz not null default now()
);
alter table public.top_scorers enable row level security;
create policy top_scorers_select_anon on public.top_scorers for select to anon using (true);
create policy top_scorers_select_auth on public.top_scorers for select to authenticated using (true);

-- ---------- Evolución del ranking (solo miembros) ----------
create or replace function public.get_pool_timeline(p_pool_id uuid)
returns table (user_id uuid, display_name text, day date, points bigint)
language plpgsql security definer set search_path = public stable as $$
begin
  if not public.is_pool_member(p_pool_id) then
    raise exception 'No eres miembro de esta polla';
  end if;
  return query
    select p.user_id,
           coalesce(nullif(trim(pr.first_name || ' ' || pr.last_name), ''), pr.username, split_part(pr.email, '@', 1)),
           (m.kickoff_at at time zone 'America/Lima')::date,
           sum(coalesce(p.points_awarded, 0))
      from public.predictions p
      join public.matches m on m.id = p.match_id and m.status = 'finished'
      join public.profiles pr on pr.id = p.user_id
     where p.pool_id = p_pool_id
     group by 1, 2, 3
     order by 3;
end;
$$;

-- ---------- Suscripciones Web Push ----------
create table public.push_subscriptions (
  endpoint   text primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
create index on public.push_subscriptions (user_id);
alter table public.push_subscriptions enable row level security;
create policy push_own_select on public.push_subscriptions for select to authenticated using (user_id = auth.uid());
create policy push_own_insert on public.push_subscriptions for insert to authenticated with check (user_id = auth.uid());
create policy push_own_delete on public.push_subscriptions for delete to authenticated using (user_id = auth.uid());
