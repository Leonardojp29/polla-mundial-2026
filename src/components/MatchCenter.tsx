import Link from 'next/link';
import { Flag } from '@/components/Flag';
import { AutoRefresh } from '@/components/AutoRefresh';
import { matchDayParts } from '@/lib/dates';
import { IconCalendar, IconNext, LiveDot } from '@/components/Icons';
import type { MatchLite } from '@/components/TournamentExplorer';

// Mi pronóstico (Polla Global) por id de partido.
export type MyPredMap = Record<number, { h: number; a: number }>;

function MatchChip({ m, pred }: { m: MatchLite; pred?: { h: number; a: number } }) {
  const { time } = matchDayParts(m.kickoff);
  const live = m.status === 'live';
  const finished = m.status === 'finished';

  return (
    <Link
      href={`/partidos/${m.id}`}
      className={`flex min-w-[230px] flex-1 flex-col rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:min-w-[260px] ${
        live ? 'border-red-200 ring-2 ring-red-100' : 'border-slate-200 hover:border-emerald-300'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <Flag code={m.home?.flag} className="h-6 w-9" />
          <span className="w-full truncate text-center text-xs font-bold leading-tight">
            {m.home?.name ?? m.homeLabel ?? '—'}
          </span>
        </div>

        <div className="shrink-0 text-center">
          {live && (
            <span className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-red-600">
              <LiveDot />
              En vivo
            </span>
          )}
          {finished && (
            <span className="mb-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
              Final
            </span>
          )}
          {live || finished ? (
            <p className="text-2xl font-black tabular-nums">
              {m.hs ?? 0} – {m.as ?? 0}
            </p>
          ) : (
            <>
              <p className="text-2xl font-black tabular-nums text-slate-800">{time}</p>
              <p className="text-[9px] uppercase tracking-wide text-slate-300">hora Perú</p>
            </>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <Flag code={m.away?.flag} className="h-6 w-9" />
          <span className="w-full truncate text-center text-xs font-bold leading-tight">
            {m.away?.name ?? m.awayLabel ?? '—'}
          </span>
        </div>
      </div>

      {/* Mi pronóstico (Polla Global) */}
      <p className="mt-3 border-t border-slate-100 pt-2 text-center text-xs">
        {pred ? (
          <span className="font-semibold text-emerald-700">
            Tu pronóstico: <span className="font-black tabular-nums">{pred.h} – {pred.a}</span>
          </span>
        ) : !finished && !live ? (
          <span className="font-medium text-amber-600">Aún no pronosticas este partido</span>
        ) : (
          <span className="text-slate-400">Sin pronóstico</span>
        )}
      </p>
    </Link>
  );
}

// Partidos de HOY (en vivo primero) o, si hoy no hay, el próximo por jugarse.
// Con auto-refresco mientras haya partidos pendientes hoy.
export function MatchCenter({
  matches,
  myPreds = {},
}: {
  matches: MatchLite[];
  myPreds?: MyPredMap;
}) {
  const today = matches.filter((m) => m.kickoff && matchDayParts(m.kickoff).isToday);
  const anyPendingToday = today.some((m) => m.status !== 'finished');
  const anyLive = today.some((m) => m.status === 'live');

  const next =
    today.length === 0
      ? matches
          .filter((m) => m.status === 'scheduled' && m.kickoff && Date.parse(m.kickoff) > Date.now())
          .sort((a, b) => Date.parse(a.kickoff!) - Date.parse(b.kickoff!))[0]
      : null;

  if (today.length === 0 && !next) return null;

  const order: Record<string, number> = { live: 0, scheduled: 1, finished: 2 };
  const sorted = [...today].sort(
    (a, b) =>
      order[a.status] - order[b.status] ||
      Date.parse(a.kickoff ?? '') - Date.parse(b.kickoff ?? ''),
  );

  return (
    <section className="mb-8">
      {anyPendingToday && <AutoRefresh seconds={anyLive ? 30 : 60} />}
      <div className="mb-3 flex items-center gap-3">
        <h2 className="flex items-center gap-2 text-xl font-black tracking-tight">
          {today.length > 0 ? (
            anyLive ? (
              <>
                <LiveDot className="h-2.5 w-2.5" /> Jugando ahora
              </>
            ) : (
              <>
                <IconCalendar className="h-5 w-5 text-emerald-600" /> Hoy juegan
              </>
            )
          ) : (
            <>
              <IconNext className="h-5 w-5 text-emerald-600" /> Próximo partido
            </>
          )}
        </h2>
        <span className="h-px flex-1 bg-slate-200" />
        <a
          href="#calendario"
          className="text-xs font-semibold text-emerald-700 hover:underline"
        >
          Calendario completo ↓
        </a>
      </div>
      <div className="flex flex-wrap gap-3">
        {today.length > 0 ? (
          sorted.map((m) => <MatchChip key={m.id} m={m} pred={myPreds[m.id]} />)
        ) : (
          <MatchChip m={next!} pred={myPreds[next!.id]} />
        )}
      </div>
    </section>
  );
}
