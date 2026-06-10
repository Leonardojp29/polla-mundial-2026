'use client';

import { useActionState, useState } from 'react';
import { savePredictions, type SaveState } from '@/lib/actions/predictions';
import { Flag } from '@/components/Flag';
import { MatchPredictionsPeek } from '@/components/MatchPredictionsPeek';
import { IconAlert, IconCalendar, IconLock, IconMapPin } from '@/components/Icons';

export type MatchVM = {
  id: number;
  locked: boolean;
  day: string; // "Miércoles, 17 de junio"
  time: string; // "12:00" (hora Colombia)
  isToday: boolean;
  venue: string | null;
  stageLabel?: string;
  finished: boolean;
  realHome: number | null;
  realAway: number | null;
  home: { name: string; flagCode: string | null };
  away: { name: string; flagCode: string | null };
  predHome: number | null;
  predAway: number | null;
  points: number | null;
};

// ---------- Stepper de marcador (− / valor / +) ----------
function Stepper({
  name,
  value,
  onChange,
  disabled,
  ariaLabel,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  ariaLabel: string;
}) {
  const n = value === '' ? null : Number(value);
  // Compacto en celulares chicos (390px); tamaño completo desde sm.
  const btn =
    'flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-full border text-base sm:text-lg font-bold transition select-none ' +
    'border-slate-200 text-slate-500 hover:border-emerald-400 hover:text-emerald-600 ' +
    'disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-500';

  return (
    <div className="flex items-center gap-1 sm:gap-1.5">
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled || n === null}
        onClick={() => onChange(n !== null && n > 0 ? String(n - 1) : '')}
        className={btn}
        aria-label={`Restar gol a ${ariaLabel}`}
      >
        −
      </button>
      <input
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 2))}
        disabled={disabled}
        inputMode="numeric"
        placeholder="·"
        aria-label={`Goles de ${ariaLabel}`}
        className="h-9 w-9 rounded-lg text-lg sm:h-11 sm:w-11 sm:rounded-xl sm:text-xl border border-slate-300 bg-white text-center font-black tabular-nums outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 disabled:bg-slate-50 disabled:text-slate-400"
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled || (n ?? 0) >= 20}
        onClick={() => onChange(String(Math.min(20, (n ?? 0) + 1)))}
        className={btn}
        aria-label={`Sumar gol a ${ariaLabel}`}
      >
        +
      </button>
    </div>
  );
}

// ---------- Tarjeta de partido ----------
function MatchCard({ m, poolId }: { m: MatchVM; poolId: string }) {
  const [h, setH] = useState(m.predHome?.toString() ?? '');
  const [a, setA] = useState(m.predAway?.toString() ?? '');

  const tendency =
    h !== '' && a !== ''
      ? Number(h) > Number(a)
        ? `Gana ${m.home.name}`
        : Number(a) > Number(h)
          ? `Gana ${m.away.name}`
          : 'Empate'
      : null;

  const myPred = m.predHome !== null ? `${m.predHome} – ${m.predAway}` : null;

  return (
    <div
      className={`rounded-2xl border bg-white p-4 shadow-sm transition ${
        m.locked ? 'border-slate-100' : 'border-slate-200 hover:border-emerald-200'
      }`}
    >
      {/* Cabecera: sede / estado */}
      <div className="mb-3 flex items-center justify-between gap-2 text-xs text-slate-400">
        <span className="truncate">
          {m.stageLabel && (
            <span className="mr-2 rounded bg-slate-100 px-1.5 py-0.5 font-bold uppercase tracking-wide text-slate-500">
              {m.stageLabel}
            </span>
          )}
          {m.venue && (
            <>
              <IconMapPin className="mr-0.5 h-3 w-3" />
              {m.venue}
            </>
          )}
        </span>
        {m.finished ? (
          <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 font-semibold text-slate-500">
            Finalizado
          </span>
        ) : m.locked ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 font-semibold text-amber-600">
            <IconLock className="h-3 w-3" /> En juego / cerrado
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 font-semibold text-emerald-600">
            Abierto
          </span>
        )}
      </div>

      {/* Cuerpo: equipo · centro · equipo */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-1.5 sm:gap-2">
        <div className="flex flex-col items-center gap-1.5">
          <Flag code={m.home.flagCode} className="h-7 w-10 sm:h-8 sm:w-12" />
          <span className="text-center text-sm font-bold leading-tight">{m.home.name}</span>
          {!m.finished && (
            <Stepper
              name={`h-${m.id}`}
              value={h}
              onChange={setH}
              disabled={m.locked}
              ariaLabel={m.home.name}
            />
          )}
        </div>

        <div className="min-w-14 px-0.5 pt-1 text-center sm:min-w-24 sm:px-1">
          {m.finished ? (
            <>
              <p className="text-2xl font-black tabular-nums sm:text-3xl">
                {m.realHome} – {m.realAway}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                {myPred ? <>Tu pronóstico: {myPred}</> : 'Sin pronóstico'}
              </p>
              {m.points !== null && (
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-black ${
                    m.points > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  +{m.points} pts
                </span>
              )}
            </>
          ) : (
            <>
              {m.isToday && (
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                  Hoy
                </p>
              )}
              <p className="text-2xl font-black tabular-nums text-slate-800 sm:text-3xl">
                {m.time}
              </p>
              <p className="text-[10px] uppercase tracking-wide text-slate-300">hora Perú · vs</p>
            </>
          )}
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <Flag code={m.away.flagCode} className="h-7 w-10 sm:h-8 sm:w-12" />
          <span className="text-center text-sm font-bold leading-tight">{m.away.name}</span>
          {!m.finished && (
            <Stepper
              name={`a-${m.id}`}
              value={a}
              onChange={setA}
              disabled={m.locked}
              ariaLabel={m.away.name}
            />
          )}
        </div>
      </div>

      {/* Tendencia en vivo del pronóstico */}
      {tendency && !m.locked && (
        <p className="mt-3 text-center">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            Tu pronóstico: {tendency}
          </span>
        </p>
      )}

      {/* Partido ya iniciado: se abren los pronósticos de la polla */}
      {m.locked && <MatchPredictionsPeek poolId={poolId} matchId={m.id} />}
    </div>
  );
}

// ---------- Formulario (agrupado por día) ----------
export function PredictionsForm({
  poolId,
  formKey,
  submitLabel,
  matches,
}: {
  poolId: string;
  formKey: string;
  submitLabel: string;
  matches: MatchVM[];
}) {
  const [state, formAction, pending] = useActionState<SaveState, FormData>(savePredictions, {});
  const [incomplete, setIncomplete] = useState<string[]>([]);
  const editable = matches.some((m) => !m.locked);

  // Si un partido tiene solo un marcador (p. ej. México 2 y Sudáfrica vacío),
  // no se guardaría nada de ese partido: avisamos antes de enviar.
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const fd = new FormData(e.currentTarget);
    const halfFilled = matches
      .filter((m) => !m.locked)
      .filter((m) => {
        const h = String(fd.get(`h-${m.id}`) ?? '');
        const a = String(fd.get(`a-${m.id}`) ?? '');
        return (h === '') !== (a === '');
      })
      .map((m) => `${m.home.name} vs ${m.away.name}`);
    if (halfFilled.length > 0) {
      e.preventDefault();
      setIncomplete(halfFilled);
    } else {
      setIncomplete([]);
    }
  }

  // Secciones por día (los partidos ya vienen ordenados por kickoff).
  const days: { day: string; isToday: boolean; items: MatchVM[] }[] = [];
  for (const m of matches) {
    const last = days[days.length - 1];
    if (last && last.day === m.day) last.items.push(m);
    else days.push({ day: m.day, isToday: m.isToday, items: [m] });
  }

  return (
    <form key={formKey} action={formAction} onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="pool_id" value={poolId} />

      {days.map((d) => (
        <section key={d.day} className="space-y-2.5">
          <div className="flex items-center gap-3 pt-1">
            <h3 className="flex items-center gap-1.5 text-sm font-black uppercase tracking-wide text-slate-700">
              <IconCalendar className="h-4 w-4 text-emerald-600" /> {d.day}
            </h3>
            {d.isToday && (
              <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-white">
                Hoy
              </span>
            )}
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          {d.items.map((m) => (
            <MatchCard key={m.id} m={m} poolId={poolId} />
          ))}
        </section>
      ))}

      {incomplete.length > 0 && (
        <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <p className="flex items-center gap-1.5 font-semibold">
            <IconAlert className="h-4 w-4 shrink-0 text-amber-600" />
            Falta el marcador del otro equipo en:
          </p>
          <ul className="mt-1 list-inside list-disc">
            {incomplete.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-amber-700">
            Completa ambos marcadores (o deja los dos vacíos) y vuelve a guardar.
          </p>
        </div>
      )}

      {(state.ok || state.error) && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            state.error ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {state.ok ?? state.error}
        </p>
      )}

      {editable && (
        <div className="sticky bottom-3 z-10">
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {pending ? 'Guardando…' : submitLabel}
          </button>
        </div>
      )}
    </form>
  );
}
