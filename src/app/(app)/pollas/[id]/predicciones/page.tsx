import { createClient } from '@/lib/supabase/server';
import { getGroupMatches } from '@/lib/publicData';
import { matchDayParts } from '@/lib/dates';
import { type MatchVM } from '@/components/PredictionsForm';
import { GroupsPredictions, type GroupMeta } from '@/components/GroupsPredictions';

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

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

  // Grupo inicial: el de la URL o el del próximo partido por jugarse
  // (así "los partidos de hoy" te reciben al entrar).
  let initialGroup = GROUPS.includes((sp.grupo ?? '').toUpperCase())
    ? (sp.grupo as string).toUpperCase()
    : null;
  const nowMs = Date.now();
  if (!initialGroup) {
    const next = matches.find(
      (m) => m.kickoff_at && new Date(m.kickoff_at).getTime() > nowMs && m.group_letter,
    );
    initialGroup = next?.group_letter ?? 'A';
  }

  // VMs de los 72 partidos + metadatos por grupo, todo en una pasada.
  const matchesByGroup: Record<string, MatchVM[]> = {};
  const flagsByGroup = new Map<string, Map<string, string | null>>();
  const counts = new Map<string, { done: number; total: number }>();
  for (const g of GROUPS) {
    matchesByGroup[g] = [];
    flagsByGroup.set(g, new Map());
    counts.set(g, { done: 0, total: 0 });
  }

  for (const m of matches) {
    const g = m.group_letter ?? '';
    if (!(g in matchesByGroup)) continue;
    const p = preds.get(m.id);
    const { day, time, isToday } = matchDayParts(m.kickoff_at);

    matchesByGroup[g].push({
      id: m.id,
      locked: !m.kickoff_at || new Date(m.kickoff_at).getTime() <= nowMs,
      day,
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

    const c = counts.get(g)!;
    c.total++;
    if (p) c.done++;
    const flags = flagsByGroup.get(g)!;
    if (m.home) flags.set(m.home.name, m.home.flag_code);
    if (m.away) flags.set(m.away.name, m.away.flag_code);
  }

  const meta: GroupMeta[] = GROUPS.map((g) => ({
    g,
    done: counts.get(g)!.done,
    total: counts.get(g)!.total,
    flags: [...flagsByGroup.get(g)!.values()].slice(0, 4),
  }));

  return (
    <GroupsPredictions
      poolId={id}
      initialGroup={initialGroup}
      meta={meta}
      matchesByGroup={matchesByGroup}
    />
  );
}
