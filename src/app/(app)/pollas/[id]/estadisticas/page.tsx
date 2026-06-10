import { createClient } from '@/lib/supabase/server';
import { getAllMatches, getGlobalConsensus } from '@/lib/publicData';
import { Flag } from '@/components/Flag';
import { matchDayParts } from '@/lib/dates';
import { IconUsers, LiveDot } from '@/components/Icons';

const GLOBAL_POOL_ID = '00000000-0000-0000-0000-000000000001';

// NOTA (11 jun): con el pronóstico maestro desactivado, las secciones "¿Quién
// sale campeón según la polla?" y "Goleadores más elegidos" se quitaron de esta
// página (el código queda en el historial de git por si se reactiva). Solo se
// mantiene el consenso de los próximos partidos.

type ConsensusRow = {
  match_id: number;
  home_n: number;
  draw_n: number;
  away_n: number;
  top_score: string | null;
  total: number;
};

export default async function EstadisticasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // La Polla Global usa el consenso cacheado (igual para todos);
  // las pollas privadas consultan su RPC con la sesión del usuario.
  let consensusRaw: unknown;
  let allMatches;
  if (id === GLOBAL_POOL_ID) {
    [consensusRaw, allMatches] = await Promise.all([getGlobalConsensus(), getAllMatches()]);
  } else {
    const supabase = await createClient();
    const [consensusRes, matches] = await Promise.all([
      supabase.rpc('get_pool_consensus', { p_pool_id: id }),
      getAllMatches(),
    ]);
    consensusRaw = consensusRes.data;
    allMatches = matches;
  }

  const consensus = new Map<number, ConsensusRow>(
    ((consensusRaw ?? []) as ConsensusRow[]).map((c) => [c.match_id, c]),
  );

  // Consenso: próximos partidos (o en juego) que tengan pronósticos.
  const now = Date.now();
  const upcoming = allMatches
    .filter((m) => {
      const c = consensus.get(m.id);
      if (!c || c.total === 0) return false;
      if (m.status === 'live') return true;
      return m.status === 'scheduled' && m.kickoff_at && Date.parse(m.kickoff_at) > now;
    })
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <IconUsers className="h-5 w-5 text-emerald-600" /> ¿Qué dice la polla de los próximos
          partidos?
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          Porcentaje que le va a cada resultado (sin revelar pronósticos exactos de nadie).
        </p>
        {upcoming.length === 0 ? (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">
            Aún no hay pronósticos para los próximos partidos.
          </p>
        ) : (
          <ul className="space-y-4">
            {upcoming.map((m) => {
              const c = consensus.get(m.id)!;
              const pct = (n: number) => Math.round((n / c.total) * 100);
              const { day, time } = matchDayParts(m.kickoff_at);
              return (
                <li key={m.id}>
                  <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                    <span className="flex min-w-0 items-center gap-1.5 font-semibold">
                      <Flag code={m.home?.flag_code} className="h-4 w-6" />
                      <span className="truncate">{m.home?.name ?? m.home_label}</span>
                      <span className="text-slate-400">vs</span>
                      <Flag code={m.away?.flag_code} className="h-4 w-6" />
                      <span className="truncate">{m.away?.name ?? m.away_label}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-xs text-slate-400">
                      {m.status === 'live' ? (
                        <>
                          <LiveDot /> En vivo
                        </>
                      ) : (
                        `${day} · ${time}`
                      )}
                    </span>
                  </div>
                  <div className="flex h-6 overflow-hidden rounded-lg text-[10px] font-black text-white">
                    {c.home_n > 0 && (
                      <div
                        className="flex items-center justify-center bg-emerald-600"
                        style={{ width: `${pct(c.home_n)}%` }}
                        title={`Gana ${m.home?.name ?? 'local'}: ${pct(c.home_n)}%`}
                      >
                        {pct(c.home_n)}%
                      </div>
                    )}
                    {c.draw_n > 0 && (
                      <div
                        className="flex items-center justify-center bg-slate-400"
                        style={{ width: `${pct(c.draw_n)}%` }}
                        title={`Empate: ${pct(c.draw_n)}%`}
                      >
                        {pct(c.draw_n)}%
                      </div>
                    )}
                    {c.away_n > 0 && (
                      <div
                        className="flex items-center justify-center bg-sky-600"
                        style={{ width: `${pct(c.away_n)}%` }}
                        title={`Gana ${m.away?.name ?? 'visita'}: ${pct(c.away_n)}%`}
                      >
                        {pct(c.away_n)}%
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    <span className="font-semibold text-emerald-700">
                      {m.home?.name ?? 'Local'}
                    </span>{' '}
                    · <span className="font-semibold text-slate-500">Empate</span> ·{' '}
                    <span className="font-semibold text-sky-700">{m.away?.name ?? 'Visita'}</span>
                    {c.top_score && (
                      <> · marcador más elegido: <strong>{c.top_score}</strong></>
                    )}{' '}
                    · {c.total} pronóstico{c.total === 1 ? '' : 's'}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
