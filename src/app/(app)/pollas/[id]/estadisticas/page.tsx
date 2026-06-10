import { createClient } from '@/lib/supabase/server';
import { getAllMatches, getGlobalConsensus, getGlobalStats } from '@/lib/publicData';

const GLOBAL_POOL_ID = '00000000-0000-0000-0000-000000000001';
import { Flag } from '@/components/Flag';
import { matchDayParts } from '@/lib/dates';
import { IconUsers, LiveDot } from '@/components/Icons';
import { esTeamName } from '@/lib/teamNames';
import { BallBadge, TrophyBadge } from '@/components/WcBadges';

type Stats = {
  members: number;
  with_special: number;
  champions: { name: string; flag: string | null; n: number }[];
  top_scorers: { name: string; n: number }[];
};

type ConsensusRow = {
  match_id: number;
  home_n: number;
  draw_n: number;
  away_n: number;
  top_score: string | null;
  total: number;
};

function Bar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="h-7 flex-1 overflow-hidden rounded-lg bg-slate-100">
        <div
          className="flex h-full min-w-fit items-center rounded-lg bg-emerald-500 px-2 text-xs font-bold text-white transition-all"
          style={{ width: `${Math.max(pct, 8)}%` }}
        >
          {label}
        </div>
      </div>
      <span className="w-8 shrink-0 text-right text-sm font-black tabular-nums">{value}</span>
    </div>
  );
}

export default async function EstadisticasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // La Polla Global usa los agregados cacheados (iguales para todos);
  // las pollas privadas consultan sus RPCs con la sesión del usuario.
  let statsRaw: unknown;
  let consensusRaw: unknown;
  let allMatches;
  if (id === GLOBAL_POOL_ID) {
    [statsRaw, consensusRaw, allMatches] = await Promise.all([
      getGlobalStats(),
      getGlobalConsensus(),
      getAllMatches(),
    ]);
  } else {
    const supabase = await createClient();
    const [statsRes, consensusRes, matches] = await Promise.all([
      supabase.rpc('get_pool_stats', { p_pool_id: id }),
      supabase.rpc('get_pool_consensus', { p_pool_id: id }),
      getAllMatches(),
    ]);
    statsRaw = statsRes.data;
    consensusRaw = consensusRes.data;
    allMatches = matches;
  }

  const stats = (statsRaw ?? {
    members: 0,
    with_special: 0,
    champions: [],
    top_scorers: [],
  }) as Stats;
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

  const maxChamp = stats.champions[0]?.n ?? 0;

  return (
    <div className="space-y-6">
      {/* Campeón más elegido */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2.5 text-lg font-bold">
          <TrophyBadge className="h-8 w-8" /> ¿Quién sale campeón según la polla?
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          {stats.with_special} de {stats.members} jugador{stats.members === 1 ? '' : 'es'} ya
          hicieron su pronóstico maestro.
        </p>
        {stats.champions.length === 0 ? (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">
            Nadie ha elegido campeón todavía. ¡Sé el primero en la pestaña Maestro!
          </p>
        ) : (
          <ul className="space-y-2">
            {stats.champions.map((c) => (
              <li key={c.name} className="flex items-center gap-2">
                <Flag code={c.flag} className="h-5 w-7 shrink-0" />
                <span className="w-32 shrink-0 truncate text-sm font-semibold">
                  {esTeamName(c.name)}
                </span>
                <div className="flex-1">
                  <Bar
                    value={c.n}
                    max={maxChamp}
                    label={
                      stats.with_special > 0
                        ? `${Math.round((c.n / stats.with_special) * 100)}%`
                        : ''
                    }
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Goleadores más elegidos */}
      {stats.top_scorers.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2.5 text-lg font-bold">
            <BallBadge className="h-8 w-8" /> Goleadores más elegidos
          </h2>
          <ul className="flex flex-wrap gap-2">
            {stats.top_scorers.map((s) => (
              <li
                key={s.name}
                className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700"
              >
                {s.name}
                <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-black text-white">
                  {s.n}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Consenso de próximos partidos */}
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
