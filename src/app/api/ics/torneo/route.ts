import { getAllMatches } from '@/lib/publicData';
import { matchesToIcs, icsResponse } from '@/lib/ics';
import { normTeamName } from '@/lib/teamNames';

const KO_STAGES = ['r32', 'r16', 'qf', 'sf', 'third', 'final'];

// Feed .ics del torneo, filtrable: ?fase=group|ko y ?q=<selección>.
// Sin query sirve de suscripción (todo el Mundial o una fase); con filtros
// funciona como descarga de "exactamente lo que estoy viendo".
export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const fase = searchParams.get('fase');
  const q = normTeamName(searchParams.get('q') ?? '');

  let matches = await getAllMatches();
  if (fase === 'group') matches = matches.filter((m) => m.stage === 'group');
  if (fase === 'ko') matches = matches.filter((m) => KO_STAGES.includes(m.stage));
  if (q !== '') {
    matches = matches.filter(
      (m) =>
        normTeamName(m.home?.name ?? m.home_label ?? '').includes(q) ||
        normTeamName(m.away?.name ?? m.away_label ?? '').includes(q),
    );
  }

  const name =
    fase === 'group'
      ? 'Mundial 2026 — Fase de grupos'
      : fase === 'ko'
        ? 'Mundial 2026 — Eliminatorias'
        : 'Mundial 2026 — Todos los partidos';
  const ics = matchesToIcs(name, matches, origin);
  return icsResponse(ics, 'mundial-2026.ics', q !== '');
}
