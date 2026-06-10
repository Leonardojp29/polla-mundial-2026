import { getAllMatches, getTeams } from '@/lib/publicData';
import { matchesToIcs, icsResponse } from '@/lib/ics';

// Feed .ics con TODOS los partidos de una selección. Pensado para SUSCRIBIRSE
// (webcal/Google "por URL"): cuando clasifique a eliminatorias, los cruces
// aparecen solos en el calendario del usuario.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { origin } = new URL(request.url);
  const [teams, allMatches] = await Promise.all([getTeams(), getAllMatches()]);
  const team = teams.find((t) => t.id === id);
  if (!team) return new Response('Selección no encontrada', { status: 404 });

  const matches = allMatches.filter((m) => m.home_team_id === id || m.away_team_id === id);
  const ics = matchesToIcs(`Mundial 2026 — ${team.name}`, matches, origin);
  return icsResponse(ics, `mundial-2026-${id}.ics`, false);
}
