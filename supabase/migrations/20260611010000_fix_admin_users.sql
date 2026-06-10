-- Fix: admin_list_users fallaba con 42702 ("column reference role is
-- ambiguous"): el parámetro de salida `role` chocaba con profiles.role dentro
-- del chequeo de admin. Se califica todo con alias.

create or replace function public.admin_list_users()
returns table (
  user_id          uuid,
  first_name       text,
  last_name        text,
  username         text,
  email            text,
  country          text,
  phone            text,
  date_of_birth    date,
  avatar_url       text,
  role             user_role,
  created_at       timestamptz,
  pools            jsonb,
  global_predicted int,
  global_missing   int,
  total_predictions int
)
language plpgsql security definer set search_path = public stable as $$
declare
  v_open int;
begin
  if not exists (
    select 1 from public.profiles me
     where me.id = auth.uid() and me.role = 'admin'
  ) then
    raise exception 'Solo administradores';
  end if;

  -- Partidos abiertos hoy (con equipos definidos y kickoff futuro).
  select count(*) into v_open
    from public.matches m
   where m.status = 'scheduled'
     and m.kickoff_at > now()
     and m.home_team_id is not null
     and m.away_team_id is not null;

  return query
    select pr.id,
           pr.first_name,
           pr.last_name,
           pr.username,
           pr.email,
           pr.country,
           pr.phone,
           pr.date_of_birth,
           pr.avatar_url,
           pr.role,
           pr.created_at,
           coalesce((
             select jsonb_agg(
                      jsonb_build_object('name', p.name, 'type', p.type, 'owner', p.admin_user_id = pr.id)
                      order by p.created_at
                    )
               from public.memberships mm
               join public.pools p on p.id = mm.pool_id
              where mm.user_id = pr.id
           ), '[]'::jsonb),
           coalesce((
             select count(*) from public.predictions pd
              where pd.user_id = pr.id
                and pd.pool_id = '00000000-0000-0000-0000-000000000001'
           ), 0)::int,
           (v_open - coalesce((
             select count(*)
               from public.predictions pd
               join public.matches m2 on m2.id = pd.match_id
              where pd.user_id = pr.id
                and pd.pool_id = '00000000-0000-0000-0000-000000000001'
                and m2.status = 'scheduled'
                and m2.kickoff_at > now()
                and m2.home_team_id is not null
                and m2.away_team_id is not null
           ), 0))::int,
           coalesce((select count(*) from public.predictions pd where pd.user_id = pr.id), 0)::int
      from public.profiles pr
     order by pr.created_at desc;
end;
$$;
