// Generación de calendarios .ics (RFC 5545): un archivo puede llevar varios
// partidos, y servido como feed permite SUSCRIBIRSE (los cruces de
// eliminatorias y cambios de horario se actualizan solos en el teléfono).
import type { MatchRow } from '@/lib/publicData';
import { getStadium } from '@/lib/stadiums';

const DURATION_MIN = 105;

function icsDate(ms: number): string {
  return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

// Escapa texto según RFC 5545 (comas, puntos y coma, saltos).
function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function matchesToIcs(
  calendarName: string,
  matches: MatchRow[],
  baseUrl: string,
): string {
  const now = icsDate(Date.now());
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Polla Mundial//Mundial 2026//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${esc(calendarName)}`,
    'X-WR-TIMEZONE:UTC',
    // Pista de refresco para clientes suscritos (Apple/Google la respetan a su modo).
    'REFRESH-INTERVAL;VALUE=DURATION:PT6H',
    'X-PUBLISHED-TTL:PT6H',
  ];

  for (const m of matches) {
    if (!m.kickoff_at) continue;
    const start = Date.parse(m.kickoff_at);
    const home = m.home?.name ?? m.home_label ?? 'Por definir';
    const away = m.away?.name ?? m.away_label ?? 'Por definir';
    const stadium = getStadium(m.venue);
    lines.push(
      'BEGIN:VEVENT',
      `UID:partido-${m.id}@polla-mundial`,
      `DTSTAMP:${now}`,
      `DTSTART:${icsDate(start)}`,
      `DTEND:${icsDate(start + DURATION_MIN * 60_000)}`,
      `SUMMARY:${esc(`${home} vs ${away} — Mundial 2026`)}`,
      ...(stadium ? [`LOCATION:${esc(`${stadium.stadium}, ${stadium.city}`)}`] : []),
      `DESCRIPTION:${esc(`Pronostica en Polla Mundial: ${baseUrl}/partidos/${m.id}`)}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

export function icsResponse(ics: string, filename: string, download: boolean): Response {
  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${filename}"`,
      'Cache-Control': 'public, max-age=600',
    },
  });
}
