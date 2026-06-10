import { createClient } from '@/lib/supabase/server';
import { getGroupMatches } from '@/lib/publicData';
import { matchDayParts } from '@/lib/dates';
import { type MatchVM } from '@/components/PredictionsForm';
import { GroupsPredictions, type GroupMeta, type DayMeta } from '@/components/GroupsPredictions';

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const TZ = 'America/Lima';

export default async function PrediccionesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ grupo?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const supabase = await createClient();

  // matches: caché pública compartida (no toca la BD en cada vista);
  // predictions: del usuario, en paralelo.
  const [matches, { data: predData }] = await Promise.all([
    getGroupMatches(),
    supabase
      .from('predictions')
      .select('match_id, pred_home_score, pred_away_score, points_awarded')
      .eq('pool_id', id),
  ]);

  const preds = new Map(
    (predData ?? []).map((p) => [
      p.match_id,
      { h: p.pred_home_score, a: p.pred_away_score, pts: p.points_awarded },
    ]),
  );

  // ?grupo=C en la URL fuerza el modo grupo (lo usan enlaces internos).
  const initialGroup = GROUPS.includes((sp.grupo ?? '').toUpperCase())
    ? (sp.grupo as string).toUpperCase()
    : null;

  const nowMs = Date.now();

  // VMs de los 72 partidos + metadatos por grupo y por día, en una pasada.
  const vms: MatchVM[] = [];
  const flagsByGroup = new Map<string, Map<string, string | null>>();
  const groupCounts = new Map<string, { done: number; total: number }>();
  for (const g of GROUPS) {
    flagsByGroup.set(g, new Map());
    groupCounts.set(g, { done: 0, total: 0 });
  }
  const dayMeta = new Map<string, DayMeta>();

  for (const m of matches) {
    const g = m.group_letter ?? '';
    if (!groupCounts.has(g)) continue;
    const p = preds.get(m.id);
    const { day, time, isToday } = matchDayParts(m.kickoff_at);
    const d = m.kickoff_at ? new Date(m.kickoff_at) : null;
    const dayKey = d ? d.toLocaleDateString('en-CA', { timeZone: TZ }) : 'tbd';

    vms.push({
      id: m.id,
      locked: !m.kickoff_at || new Date(m.kickoff_at).getTime() <= nowMs,
      day,
      dayKey,
      g,
      time,
      isToday,
      venue: m.venue,
      finished: m.status === 'finished',
      realHome: m.home_score,
      realAway: m.away_score,
      home: { name: m.home?.name ?? '?', flagCode: m.home?.flag_code ?? null },
      away: { name: m.away?.name ?? '?', flagCode: m.away?.flag_code ?? null },
      predHome: p?.h ?? null,
      predAway: p?.a ?? null,
      points: p?.pts ?? null,
    });

    const c = groupCounts.get(g)!;
    c.total++;
    if (p) c.done++;
    const flags = flagsByGroup.get(g)!;
    if (m.home) flags.set(m.home.name, m.home.flag_code);
    if (m.away) flags.set(m.away.name, m.away.flag_code);

    if (d) {
      if (!dayMeta.has(dayKey)) {
        dayMeta.set(dayKey, {
          key: dayKey,
          wk: d
            .toLocaleDateString('es-PE', { timeZone: TZ, weekday: 'short' })
            .replace('.', '')
            .toUpperCase(),
          dn: d.toLocaleDateString('es-PE', { timeZone: TZ, day: '2-digit' }),
          mon: d.toLocaleDateString('es-PE', { timeZone: TZ, month: 'short' }).replace('.', ''),
          isToday,
          done: 0,
          total: 0,
        });
      }
      const dm = dayMeta.get(dayKey)!;
      dm.total++;
      if (p) dm.done++;
    }
  }

  const meta: GroupMeta[] = GROUPS.map((g) => ({
    g,
    done: groupCounts.get(g)!.done,
    total: groupCounts.get(g)!.total,
    flags: [...flagsByGroup.get(g)!.values()].slice(0, 4),
  }));

  const days = [...dayMeta.values()].sort((a, b) => a.key.localeCompare(b.key));

  // Fecha inicial: hoy si hay partidos hoy; si no, la próxima con partidos
  // pendientes; si la fase ya terminó, todas.
  const todayKey = new Date().toLocaleDateString('en-CA', { timeZone: TZ });
  const initialDay =
    days.find((d) => d.key === todayKey)?.key ??
    days.find((d) => d.key > todayKey)?.key ??
    'all';

  return (
    <GroupsPredictions
      poolId={id}
      matches={vms}
      meta={meta}
      days={days}
      initialDay={initialDay}
      initialGroup={initialGroup}
    />
  );
}
