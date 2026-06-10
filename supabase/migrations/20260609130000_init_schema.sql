-- ============================================================================
-- Polla Mundial — Mundial 2026
-- Esquema inicial: usuarios, pollas (global + privadas), partidos, predicciones.
-- ============================================================================

-- ---------- Tipos ----------
create type pool_type    as enum ('global', 'private');
create type user_role    as enum ('user', 'admin');
create type match_stage  as enum ('group', 'r32', 'r16', 'qf', 'sf', 'third', 'final');
create type match_status as enum ('scheduled', 'live', 'finished');

-- ID fijo de la única polla global (todos quedan inscritos al registrarse).
-- '00000000-0000-0000-0000-000000000001'

-- ---------- Utilidades ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Reglas de puntaje por defecto (configurables por polla).
create or replace function public.default_scoring_rules()
returns jsonb language sql immutable as $$
  select '{
    "group":  {"exact": 5,  "result": 3},
    "r32":    {"exact": 5,  "result": 3},
    "r16":    {"exact": 6,  "result": 3},
    "qf":     {"exact": 7,  "result": 4},
    "sf":     {"exact": 8,  "result": 5},
    "third":  {"exact": 6,  "result": 3},
    "final":  {"exact": 10, "result": 5},
    "special": {
      "group_winner": 3, "group_runner_up": 2, "semifinalist": 8,
      "runner_up": 15, "champion": 25, "top_scorer": 15
    }
  }'::jsonb;
$$;

-- Genera un código de polla tipo "WC26-XXXX" (sin caracteres ambiguos I/O/0/1).
create or replace function public.gen_pool_code()
returns text language plpgsql as $$
declare
  chars  text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..4 loop
    result := result || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  end loop;
  return 'WC26-' || result;
end;
$$;

-- ---------- Tablas ----------
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  first_name    text not null default '',
  last_name     text not null default '',
  username      text unique,
  email         text unique,
  avatar_url    text,
  country       text,
  phone         text,
  date_of_birth date,
  role          user_role not null default 'user',
  is_active     boolean not null default true,
  last_login_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.pools (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  type          pool_type not null default 'private',
  code          text unique,
  admin_user_id uuid references public.profiles(id) on delete set null,
  scoring_rules jsonb not null default public.default_scoring_rules(),
  join_deadline timestamptz,
  created_at    timestamptz not null default now()
);

create table public.memberships (
  id        uuid primary key default gen_random_uuid(),
  pool_id   uuid not null references public.pools(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  nickname  text,
  joined_at timestamptz not null default now(),
  unique (pool_id, user_id)
);
create index on public.memberships (user_id);
create index on public.memberships (pool_id);

create table public.teams (
  id           text primary key,   -- slug estable, ej. "argentina"
  name         text not null,      -- nombre mostrado, ej. "Argentina"
  flag_code    text,               -- ISO ej. "AR" (para banderas)
  group_letter text                -- "A".."L"
);

create table public.matches (
  id             bigint generated always as identity primary key,
  ext_key        text unique,       -- clave estable de la fuente (para upsert al sincronizar)
  stage          match_stage not null,
  group_letter   text,
  home_team_id   text references public.teams(id),
  away_team_id   text references public.teams(id),
  home_label     text,              -- "Ganador Grupo A" mientras no se conoce el equipo
  away_label     text,
  kickoff_at     timestamptz,
  venue          text,
  status         match_status not null default 'scheduled',
  home_score     int,
  away_score     int,
  winner_team_id text references public.teams(id)
);
create index on public.matches (kickoff_at);
create index on public.matches (stage);

create table public.predictions (
  id               uuid primary key default gen_random_uuid(),
  pool_id          uuid not null references public.pools(id) on delete cascade,
  user_id          uuid not null references public.profiles(id) on delete cascade,
  match_id         bigint not null references public.matches(id) on delete cascade,
  pred_home_score  int not null check (pred_home_score >= 0),
  pred_away_score  int not null check (pred_away_score >= 0),
  points_awarded   int,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (pool_id, user_id, match_id)
);
create index on public.predictions (pool_id, user_id);
create index on public.predictions (match_id);

create table public.special_predictions (
  id                    uuid primary key default gen_random_uuid(),
  pool_id               uuid not null references public.pools(id) on delete cascade,
  user_id               uuid not null references public.profiles(id) on delete cascade,
  champion_team_id      text references public.teams(id),
  runner_up_team_id     text references public.teams(id),
  semifinalist_team_ids text[],
  top_scorer_name       text,
  group_winners         jsonb,
  points_awarded        int,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (pool_id, user_id)
);

-- updated_at automático
create trigger trg_profiles_updated   before update on public.profiles            for each row execute function public.set_updated_at();
create trigger trg_predictions_updated before update on public.predictions         for each row execute function public.set_updated_at();
create trigger trg_special_updated     before update on public.special_predictions for each row execute function public.set_updated_at();

-- ---------- Polla global ----------
insert into public.pools (id, name, type, code, admin_user_id, join_deadline)
values (
  '00000000-0000-0000-0000-000000000001',
  'Polla Global',
  'global',
  null,
  null,
  timestamptz '2026-06-11 18:00:00+00'   -- cierre del pronóstico maestro (inicio del torneo)
);

-- ---------- Alta de usuario: crea perfil + inscribe en la global ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, first_name, last_name, username, country)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'country'
  );
  insert into public.memberships (pool_id, user_id)
  values ('00000000-0000-0000-0000-000000000001', new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================

-- Helper: ¿el usuario actual es miembro de la polla? (security definer evita
-- recursión de RLS sobre memberships).
create or replace function public.is_pool_member(p_pool_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.memberships m
    where m.pool_id = p_pool_id and m.user_id = auth.uid()
  );
$$;

alter table public.profiles            enable row level security;
alter table public.pools               enable row level security;
alter table public.memberships         enable row level security;
alter table public.teams               enable row level security;
alter table public.matches             enable row level security;
alter table public.predictions         enable row level security;
alter table public.special_predictions enable row level security;

-- profiles: cada quien ve/edita SOLO su perfil (los nombres del ranking salen por RPC).
create policy profiles_select_own on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_update_own on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- pools: ves la global o las pollas donde eres miembro (unirse por código es vía RPC).
create policy pools_select on public.pools for select to authenticated
  using (type = 'global' or public.is_pool_member(id));

-- memberships: ves las tuyas y las de las pollas a las que perteneces.
create policy memberships_select on public.memberships for select to authenticated
  using (user_id = auth.uid() or public.is_pool_member(pool_id));
create policy memberships_insert_self on public.memberships for insert to authenticated
  with check (user_id = auth.uid());

-- teams / matches: lectura pública para usuarios autenticados (la carga es vía service role).
create policy teams_select   on public.teams   for select to authenticated using (true);
create policy matches_select on public.matches for select to authenticated using (true);

-- predictions: solo las tuyas; solo puedes crear/editar antes del inicio del partido.
create policy predictions_select_own on public.predictions for select to authenticated
  using (user_id = auth.uid());
create policy predictions_insert_own on public.predictions for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.is_pool_member(pool_id)
    and (select kickoff_at from public.matches where id = match_id) > now()
  );
create policy predictions_update_own on public.predictions for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (select kickoff_at from public.matches where id = match_id) > now()
  );

-- special_predictions: solo las tuyas; bloqueadas tras el deadline de la polla.
create policy special_select_own on public.special_predictions for select to authenticated
  using (user_id = auth.uid());
create policy special_insert_own on public.special_predictions for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.is_pool_member(pool_id)
    and (select join_deadline from public.pools where id = pool_id) > now()
  );
create policy special_update_own on public.special_predictions for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (select join_deadline from public.pools where id = pool_id) > now()
  );

-- ============================================================================
-- RPC (funciones que llama el frontend)
-- ============================================================================

-- Crear polla privada: genera código único e inscribe al creador como admin.
create or replace function public.create_pool(p_name text)
returns table (id uuid, code text)
language plpgsql security definer set search_path = public as $$
declare
  v_id   uuid;
  v_code text;
  v_try  int := 0;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  loop
    v_code := public.gen_pool_code();
    begin
      insert into public.pools (name, type, code, admin_user_id, join_deadline)
      values (coalesce(nullif(trim(p_name), ''), 'Mi polla'), 'private', v_code, auth.uid(),
              timestamptz '2026-06-11 18:00:00+00')
      returning pools.id into v_id;
      exit;
    exception when unique_violation then
      v_try := v_try + 1;
      if v_try > 8 then raise; end if;
    end;
  end loop;
  insert into public.memberships (pool_id, user_id) values (v_id, auth.uid());
  return query select v_id, v_code;
end;
$$;

-- Unirse a una polla privada con el código.
create or replace function public.join_pool_by_code(p_code text, p_nickname text default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_pool_id uuid;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  select id into v_pool_id
    from public.pools
   where upper(code) = upper(trim(p_code)) and type = 'private';
  if v_pool_id is null then
    raise exception 'Código inválido' using errcode = 'P0002';
  end if;
  insert into public.memberships (pool_id, user_id, nickname)
  values (v_pool_id, auth.uid(), nullif(trim(p_nickname), ''))
  on conflict (pool_id, user_id) do nothing;
  return v_pool_id;
end;
$$;

-- Tabla de posiciones de una polla (no expone predicciones individuales).
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
      coalesce((select sum(coalesce(p.points_awarded, 0)) from public.predictions p
                  where p.pool_id = p_pool_id and p.user_id = pr.id), 0)
      + coalesce((select sum(coalesce(sp.points_awarded, 0)) from public.special_predictions sp
                  where sp.pool_id = p_pool_id and sp.user_id = pr.id), 0),
      (select count(*) from public.predictions p
         where p.pool_id = p_pool_id and p.user_id = pr.id)
    from public.profiles pr
    where exists (select 1 from public.memberships m where m.pool_id = p_pool_id and m.user_id = pr.id)
    order by 3 desc, 4 desc;
end;
$$;
