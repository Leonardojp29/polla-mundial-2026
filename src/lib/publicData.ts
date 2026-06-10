import { createClient } from '@supabase/supabase-js';

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

export async function getGroupMatches(): Promise<MatchRow[]> {
  const { data, error } = await publicClient
    .from('matches')
    .select(MATCH_SELECT)
    .eq('stage', 'group')
    .order('kickoff_at');
  if (error) throw error;
  return (data ?? []) as unknown as MatchRow[];
}

export async function getAllMatches(): Promise<MatchRow[]> {
  const { data, error } = await publicClient
    .from('matches')
    .select(MATCH_SELECT)
    .order('kickoff_at');
  if (error) throw error;
  return (data ?? []) as unknown as MatchRow[];
}

export type Team = {
  id: string;
  name: string;
  flag_code: string | null;
  group_letter: string | null;
};

export async function getTeams(): Promise<Team[]> {
  const { data, error } = await publicClient
    .from('teams')
    .select('id, name, flag_code, group_letter')
    .order('group_letter')
    .order('name');
  if (error) throw error;
  return (data ?? []) as Team[];
}
