import type { MatchRow } from '@/lib/publicData';

// Partidos que HOY se pueden pronosticar: con ambos equipos definidos y cuyo
// kickoff aún no llega (la RLS bloquea predecir después del inicio).
export function openMatches(matches: MatchRow[]): MatchRow[] {
  const now = Date.now();
  return matches.filter(
    (m) =>
      m.home_team_id &&
      m.away_team_id &&
      m.status === 'scheduled' &&
      m.kickoff_at &&
      Date.parse(m.kickoff_at) > now,
  );
}

export type MissingInfo = { count: number; nextCloseIso: string | null };

// Cuántos partidos abiertos le faltan pronosticar al usuario (y cuál cierra primero).
export function missingFor(open: MatchRow[], predictedMatchIds: Set<number>): MissingInfo {
  const missing = open.filter((m) => !predictedMatchIds.has(m.id));
  const nextCloseIso = missing.length
    ? missing.reduce(
        (min, m) => (Date.parse(m.kickoff_at!) < Date.parse(min) ? m.kickoff_at! : min),
        missing[0].kickoff_at!,
      )
    : null;
  return { count: missing.length, nextCloseIso };
}

// "cierra en 3 h", "cierra mañana 14:00", "cierra el sábado 13:00" (hora Perú).
export function closeLabel(iso: string | null): string | null {
  if (!iso) return null;
  const diffMs = Date.parse(iso) - Date.now();
  const hours = diffMs / 3_600_000;
  if (hours < 1) return `cierra en ${Math.max(1, Math.floor(diffMs / 60_000))} min`;
  if (hours < 24) return `cierra en ${Math.floor(hours)} h`;
  const d = new Date(iso);
  const day = d.toLocaleDateString('es-PE', { timeZone: 'America/Lima', weekday: 'long' });
  const time = d.toLocaleTimeString('es-PE', {
    timeZone: 'America/Lima',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `cierra el ${day} ${time}`;
}
