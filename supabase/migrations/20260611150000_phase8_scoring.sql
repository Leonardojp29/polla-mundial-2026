-- ============================================================================
-- Fase 8: nueva escala de puntajes + polla "clásica" (sin pronóstico maestro)
--
--   ETAPA                        RESULTADO   MARCADOR EXACTO
--   Grupos / 16vos / Octavos         2             5
--   Cuartos de final                 5            13
--   Semifinal                       10            20
--   3er puesto / Final              12            25
--
-- El pronóstico maestro queda DESACTIVADO (UI comentada): el leaderboard ya no
-- suma special_predictions. Las tablas/funciones del maestro se conservan por
-- si se reactiva.
-- ============================================================================

create or replace function public.default_scoring_rules()
returns jsonb language sql immutable as $$
  select '{
    "group":  {"exact": 5,  "result": 2},
    "r32":    {"exact": 5,  "result": 2},
    "r16":    {"exact": 5,  "result": 2},
    "qf":     {"exact": 13, "result": 5},
    "sf":     {"exact": 20, "result": 10},
    "third":  {"exact": 25, "result": 12},
    "final":  {"exact": 25, "result": 12},
    "special": {
      "group_winner": 3, "group_runner_up": 2, "semifinalist": 8,
      "runner_up": 15, "champion": 25, "top_scorer": 15
    }
  }'::jsonb;
$$;

-- Aplicar la nueva escala a TODAS las pollas existentes (aún no hay partidos
-- finalizados, así que no hay puntos que recalcular).
update public.pools set scoring_rules = public.default_scoring_rules();

-- Leaderboard sin el maestro: solo puntos de predicciones de partidos.
create or replace function public.get_leaderboard(p_pool_id uuid)
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
      coalesce(p.pts, 0),
      coalesce(p.cnt, 0)
    from public.memberships m
    join public.profiles pr on pr.id = m.user_id
    left join (
      select pd.user_id as uid, sum(coalesce(pd.points_awarded, 0)) as pts, count(*) as cnt
      from public.predictions pd
      where pd.pool_id = p_pool_id
      group by pd.user_id
    ) p on p.uid = pr.id
    where m.pool_id = p_pool_id
    order by 4 desc, 5 desc;
end;
$$;
