import { createClient } from '@/lib/supabase/server';
import { getAllMatches, type MatchRow } from '@/lib/publicData';
import { matchDayParts } from '@/lib/dates';
import { PredictionsForm, type MatchVM } from '@/components/PredictionsForm';

const STAGE_LABEL: Record<string, string> = {
  r32: 'Dieciseisavos',
  r16: 'Octavos',
  qf: 'Cuartos',
  sf: 'Semifinal',
  third: '3.er puesto',
  final: 'FINAL',
};

function fmtKickoff(iso: string | null) {
  return iso
    ? new Date(iso).toLocaleString('es-PE', {
        timeZone: 'America/Lima',
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'por definir';
}

export default async function EliminatoriasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [matches, { data: predData }] = await Promise.all([
    getAllMatches(),
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

  const knockout = matches.filter((m) => m.stage !== 'group');
  const ready = knockout.filter((m) => m.home && m.away);
  const pending = knockout.filter((m) => !m.home || !m.away);

  const now = Date.now();
  const vms: MatchVM[] = ready.map((m) => {
    const p = preds.get(m.id);
    const { day, time, isToday } = matchDayParts(m.kickoff_at);
    return {
      id: m.id,
      locked: !m.kickoff_at || new Date(m.kickoff_at).getTime() <= now,
      day,
      time,
      isToday,
      venue: m.venue,
      stageLabel: STAGE_LABEL[m.stage],
      finished: m.status === 'finished',
      realHome: m.home_score,
      realAway: m.away_score,
      home: { name: m.home!.name, flagCode: m.home!.flag_code },
      away: { name: m.away!.name, flagCode: m.away!.flag_code },
      predHome: p?.h ?? null,
      predAway: p?.a ?? null,
      points: p?.pts ?? null,
    };
  });

  // Cruces pendientes agrupados por ronda.
  const pendingByStage = new Map<string, MatchRow[]>();
  for (const m of pending) {
    if (!pendingByStage.has(m.stage)) pendingByStage.set(m.stage, []);
    pendingByStage.get(m.stage)!.push(m);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Fase eliminatoria</h2>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
          {ready.length}/32 cruces definidos
        </span>
      </div>

      <p className="rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-800">
        Cada llave se habilita cuando se definen los clasificados. Predices el marcador de
        cada cruce igual que en grupos — y los puntos valen más en cada ronda (final: 10 por
        marcador exacto). El campeón y el goleador se juegan en la pestaña{' '}
        <strong>Maestro</strong>.
      </p>

      {vms.length > 0 ? (
        <PredictionsForm
          poolId={id}
          formKey="knockout"
          submitLabel="Guardar eliminatorias"
          matches={vms}
        />
      ) : (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
          Aún no hay cruces definidos. Vuelve cuando termine la fase de grupos (27 de junio).
        </p>
      )}

      {pending.length > 0 && (
        <details className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
          <summary className="cursor-pointer font-semibold text-slate-600">
            Llaves por definir ({pending.length})
          </summary>
          <div className="mt-3 space-y-4">
            {[...pendingByStage.entries()].map(([stage, ms]) => (
              <div key={stage}>
                <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">
                  {STAGE_LABEL[stage]}
                </h3>
                <ul className="space-y-1 text-slate-500">
                  {ms.map((m) => (
                    <li key={m.id} className="flex justify-between gap-2">
                      <span className="italic">
                        {m.home?.name ?? m.home_label ?? '?'} vs {m.away?.name ?? m.away_label ?? '?'}
                      </span>
                      <span className="shrink-0 text-xs">{fmtKickoff(m.kickoff_at)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
