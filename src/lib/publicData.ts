import { createClient } from '@supabase/supabase-js';
import { esTeamName } from '@/lib/teamNames';

// Datos PÚBLICOS del torneo (equipos/partidos): no dependen del usuario, así que
// se consultan sin cookies y se cachean en el Data Cache de Next (60 s, tag
// 'public-data'). El panel admin invalida el tag al cargar un resultado, por lo
// que los cambios se ven al instante. Esto evita golpear la BD en cada vista.
const publicClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) =>
        fetch(input, { ...init, next: { revalidate: 60, tags: ['public-data'] } }),
    },
  },
);

export type TeamRef = { name: string; flag_code: string | null } | null;

export type MatchRow = {
  id: number;
  stage: 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'third' | 'final';
  group_letter: string | null;
  kickoff_at: string | null;
  venue: string | null;
  status: 'scheduled' | 'live' | 'finished';
  home_score: number | null;
  away_score: number | null;
  home_label: string | null;
  away_label: string | null;
  home_team_id: string | null;
  away_team_id: string | null;
  home: TeamRef;
  away: TeamRef;
};

const MATCH_SELECT =
  'id, stage, group_letter, kickoff_at, venue, status, home_score, away_score, home_label, away_label, home_team_id, away_team_id, ' +
  'home:teams!matches_home_team_id_fkey(name, flag_code), away:teams!matches_away_team_id_fkey(name, flag_code)';

// La BD guarda los nombres en inglés (así empareja el sync con football-data);
// aquí se traducen al español para TODO el front y los .ics.
function esMatch(m: MatchRow): MatchRow {
  return {
    ...m,
    home: m.home ? { ...m.home, name: esTeamName(m.home.name) } : null,
    away: m.away ? { ...m.away, name: esTeamName(m.away.name) } : null,
  };
}

export async function getGroupMatches(): Promise<MatchRow[]> {
  const { data, error } = await publicClient
    .from('matches')
    .select(MATCH_SELECT)
    .eq('stage', 'group')
    .order('kickoff_at');
  if (error) throw error;
  return ((data ?? []) as unknown as MatchRow[]).map(esMatch);
}

export async function getAllMatches(): Promise<MatchRow[]> {
  const { data, error } = await publicClient
    .from('matches')
    .select(MATCH_SELECT)
    .order('kickoff_at');
  if (error) throw error;
  return ((data ?? []) as unknown as MatchRow[]).map(esMatch);
}

export type Team = {
  id: string;
  name: string;
  flag_code: string | null;
  group_letter: string | null;
};

// ---------- Agregados de la POLLA GLOBAL (públicos y cacheados) ----------
// Son iguales para todos los usuarios: en vez de pegarle a la BD en cada
// apertura de modal, se sirven del Data Cache (PostgREST permite GET en RPCs
// marcadas STABLE, y los GET sí entran al caché de Next).
const GLOBAL_POOL_ID = '00000000-0000-0000-0000-000000000001';

async function cachedRpc<T>(fn: string, revalidate: number): Promise<T | null> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/${fn}?p_pool_id=${GLOBAL_POOL_ID}`,
    {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      next: { revalidate, tags: ['global-stats'] },
    },
  );
  if (!res.ok) return null;
  return res.json();
}

export type PoolStats = {
  members: number;
  with_special: number;
  champions: { name: string; flag: string | null; n: number }[];
  top_scorers: { name: string; n: number }[];
};

export type ConsensusRow = {
  match_id: number;
  home_n: number;
  draw_n: number;
  away_n: number;
  top_score: string | null;
  total: number;
};

export async function getGlobalStats(): Promise<PoolStats | null> {
  return cachedRpc<PoolStats>('get_pool_stats', 60);
}

export async function getGlobalConsensus(): Promise<ConsensusRow[]> {
  return (await cachedRpc<ConsensusRow[]>('get_pool_consensus', 30)) ?? [];
}

// ---------- Goleadores reales (los actualiza el sync) ----------
export type TopScorer = {
  player_id: number;
  player_name: string;
  team_name: string | null;
  flag_code: string | null;
  goals: number;
  assists: number | null;
  penalties: number | null;
};

export async function getTopScorers(): Promise<TopScorer[]> {
  const { data, error } = await publicClient
    .from('top_scorers')
    .select('player_id, player_name, team_name, flag_code, goals, assists, penalties')
    .order('goals', { ascending: false })
    .order('assists', { ascending: false, nullsFirst: false })
    .limit(15);
  if (error) return [];
  return ((data ?? []) as TopScorer[]).map((s) => ({
    ...s,
    team_name: s.team_name ? esTeamName(s.team_name) : null,
  }));
}

export async function getTeams(): Promise<Team[]> {
  const { data, error } = await publicClient
    .from('teams')
    .select('id, name, flag_code, group_letter')
    .order('group_letter')
    .order('name');
  if (error) throw error;
  return ((data ?? []) as Team[]).map((t) => ({ ...t, name: esTeamName(t.name) }));
}
