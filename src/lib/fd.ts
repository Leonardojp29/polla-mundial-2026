// Datos de selecciones desde football-data.org (tier gratis: 10 req/min).
// Todo va al Data Cache de Next con revalidación de 24 h, así las fichas no
// gastan cuota: 48 squads = 48 peticiones por día como máximo.
import { normTeamName, TEAM_ALIAS } from '@/lib/teamNames';

const FD = 'https://api.football-data.org/v4';

function headers() {
  return { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_TOKEN ?? '' };
}

export type FdTeamLite = { id: number; name: string; crest: string | null };

// Las 48 selecciones del Mundial (id de football-data + escudo SVG oficial).
export async function getFdTeams(): Promise<FdTeamLite[]> {
  if (!process.env.FOOTBALL_DATA_API_TOKEN) return [];
  const res = await fetch(`${FD}/competitions/WC/teams`, {
    headers: headers(),
    next: { revalidate: 86_400, tags: ['fd-teams'] },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.teams ?? []).map((t: { id: number; name: string; crest?: string }) => ({
    id: t.id,
    name: t.name,
    crest: t.crest ?? null,
  }));
}

// Empareja nuestro nombre de equipo (tabla teams) con el id de football-data.
export async function findFdTeam(ourTeamName: string): Promise<FdTeamLite | null> {
  const teams = await getFdTeams();
  const wanted = normTeamName(ourTeamName);
  return (
    teams.find((t) => {
      const n = normTeamName(t.name);
      return n === wanted || TEAM_ALIAS[n] === wanted;
    }) ?? null
  );
}

export type FdPlayer = {
  id: number;
  name: string;
  position: string | null;
  dateOfBirth: string | null;
};

export type FdTeamDetail = {
  crest: string | null;
  coach: string | null;
  squad: FdPlayer[];
};

// Plantilla (26 convocados) + DT de una selección.
export async function getFdTeamDetail(fdId: number): Promise<FdTeamDetail | null> {
  if (!process.env.FOOTBALL_DATA_API_TOKEN) return null;
  const res = await fetch(`${FD}/teams/${fdId}`, {
    headers: headers(),
    next: { revalidate: 86_400, tags: ['fd-teams'] },
  });
  if (!res.ok) return null;
  const t = await res.json();
  return {
    crest: t.crest ?? null,
    coach: t.coach?.name ?? null,
    squad: (t.squad ?? []).map(
      (p: { id: number; name: string; position?: string; dateOfBirth?: string }) => ({
        id: p.id,
        name: p.name,
        position: p.position ?? null,
        dateOfBirth: p.dateOfBirth ?? null,
      }),
    ),
  };
}

// Posición de football-data → grupo en español.
export type PositionGroup = 'Porteros' | 'Defensas' | 'Mediocampistas' | 'Delanteros';
export function positionGroup(position: string | null): PositionGroup {
  const p = (position ?? '').toLowerCase();
  if (p.includes('keeper') || p.includes('goal')) return 'Porteros';
  if (p.includes('back') || p.includes('defen')) return 'Defensas';
  if (p.includes('midfield')) return 'Mediocampistas';
  return 'Delanteros';
}
