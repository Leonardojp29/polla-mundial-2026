-- ============================================================================
-- Sincronización automática de resultados (football-data.org)
-- Funciones "system": mismas operaciones que las de admin pero SIN sesión de
-- usuario — solo ejecutables con la service role key (el script de sync).
-- ============================================================================

-- Asignar equipos a un cruce (cuando la API ya conoce la llave).
create or replace function public.system_set_teams(p_match_id bigint, p_home text, p_away text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_home = p_away then
    raise exception 'Los dos equipos no pueden ser el mismo';
  end if;
  update public.matches
     set home_team_id = p_home, away_team_id = p_away
   where id = p_match_id and stage <> 'group';
end;
$$;

-- Aplicar marcador. p_finished=false → partido EN VIVO (marcador parcial, sin
-- puntos). p_finished=true → final: resultado + recálculo de puntos por polla.
create or replace function public.system_apply_result(
  p_match_id bigint, p_home int, p_away int, p_finished boolean
)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_stage text;
begin
  if p_home is null or p_away is null or p_home < 0 or p_away < 0 then
    raise exception 'Marcador inválido';
  end if;

  if not p_finished then
    update public.matches
       set home_score = p_home, away_score = p_away, status = 'live'
     where id = p_match_id;
    return;
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

-- Solo la service role puede ejecutarlas (ni anon ni usuarios logueados).
revoke all on function public.system_set_teams(bigint, text, text) from public, anon, authenticated;
revoke all on function public.system_apply_result(bigint, int, int, boolean) from public, anon, authenticated;
grant execute on function public.system_set_teams(bigint, text, text) to service_role;
grant execute on function public.system_apply_result(bigint, int, int, boolean) to service_role;
