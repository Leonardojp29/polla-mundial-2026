const TZ = 'America/Lima';

// Partes de fecha/hora de un partido en hora de Colombia, listas para la UI.
export function matchDayParts(iso: string | null): {
  day: string;
  time: string;
  isToday: boolean;
} {
  if (!iso) return { day: 'Fecha por definir', time: '—', isToday: false };
  const d = new Date(iso);
  const day = d.toLocaleDateString('es-PE', {
    timeZone: TZ,
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
  const time = d.toLocaleTimeString('es-PE', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const key = d.toLocaleDateString('en-CA', { timeZone: TZ });
  const todayKey = new Date().toLocaleDateString('en-CA', { timeZone: TZ });
  return {
    day: day.charAt(0).toUpperCase() + day.slice(1),
    time,
    isToday: key === todayKey,
  };
}
