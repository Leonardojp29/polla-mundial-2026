// Mapea los partidos de la BD al formato del calendario (CalendarList).
import type { MatchRow } from '@/lib/publicData';
import { getStadium } from '@/lib/stadiums';
import { matchDayParts } from '@/lib/dates';
import type { CalendarMatch } from '@/components/CalendarList';

const STAGE_LABEL: Record<string, string> = {
  group: 'Grupos',
  r32: '16avos',
  r16: 'Octavos',
  qf: 'Cuartos',
  sf: 'Semis',
  third: '3.er puesto',
  final: 'FINAL',
};

// Evento de Google Calendar (105 min, hora UTC; Google la muestra en la del usuario).
function gcalUrl(
  home: string,
  away: string,
  kickoffIso: string | null,
  location: string | null,
): string | null {
  if (!kickoffIso) return null;
  const fmt = (ms: number) =>
    new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const start = Date.parse(kickoffIso);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${home} vs ${away} — Mundial 2026`,
    dates: `${fmt(start)}/${fmt(start + 105 * 60_000)}`,
    details: 'Pronostica en Polla Mundial',
    ...(location ? { location } : {}),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function toCalendarMatches(allMatches: MatchRow[]): CalendarMatch[] {
  return allMatches.map((m) => {
    const { day, time, isToday } = matchDayParts(m.kickoff_at);
    const stadium = getStadium(m.venue);
    const homeName = m.home?.name ?? m.home_label ?? 'Por definir';
    const awayName = m.away?.name ?? m.away_label ?? 'Por definir';
    return {
      id: m.id,
      stage: m.stage,
      stageLabel: STAGE_LABEL[m.stage],
      group: m.group_letter,
      day,
      time,
      isToday,
      status: m.status,
      hs: m.home_score,
      as: m.away_score,
      homeName,
      homeFlag: m.home?.flag_code ?? null,
      awayName,
      awayFlag: m.away?.flag_code ?? null,
      stadium: stadium?.stadium ?? null,
      city: stadium?.city ?? null,
      gcalUrl:
        m.status === 'scheduled'
          ? gcalUrl(
              homeName,
              awayName,
              m.kickoff_at,
              stadium ? `${stadium.stadium}, ${stadium.city}` : m.venue,
            )
          : null,
    };
  });
}
