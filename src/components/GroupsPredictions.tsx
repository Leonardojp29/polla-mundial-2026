'use client';

import { useState } from 'react';
import { Flag } from '@/components/Flag';
import { DragScroller } from '@/components/DragScroller';
import { GROUP_COLOR } from '@/lib/groupColors';
import { IconCalendar, IconCheck, IconChevronDown } from '@/components/Icons';
import { PredictionsForm, type MatchVM } from '@/components/PredictionsForm';

export type GroupMeta = {
  g: string;
  done: number;
  total: number;
  flags: (string | null)[];
};

export type DayMeta = {
  key: string; // "2026-06-11"
  wk: string; // "JUE"
  dn: string; // "11"
  mon: string; // "jun"
  isToday: boolean;
  done: number;
  total: number;
};

// Filtros tipo "modo": eliges una FECHA (los grupos se resetean a Todos) o un
// GRUPO (la fecha se resetea a Todas). Un criterio activo a la vez = nunca hay
// vistas vacías. Default: la fecha de hoy / la más próxima, con todos los grupos.
export function GroupsPredictions({
  poolId,
  matches,
  meta,
  days,
  initialDay,
  initialGroup,
}: {
  poolId: string;
  matches: MatchVM[];
  meta: GroupMeta[];
  days: DayMeta[];
  initialDay: string; // key de día o 'all'
  initialGroup: string | null; // si viene ?grupo= en la URL
}) {
  const [day, setDay] = useState(initialGroup ? 'all' : initialDay);
  const [group, setGroup] = useState(initialGroup ?? 'all');
  // El carrusel de grupos vive plegado: la fecha es el filtro protagonista.
  const [showGroups, setShowGroups] = useState(!!initialGroup);

  const pickDay = (k: string) => {
    setDay(k);
    setGroup('all');
  };
  const pickGroup = (g: string) => {
    setGroup(g);
    setDay('all');
  };

  const visible = matches.filter(
    (m) => (group === 'all' || m.g === group) && (day === 'all' || m.dayKey === day),
  );

  const totalDone = meta.reduce((sum, m) => sum + m.done, 0);
  const totalMatches = meta.reduce((sum, m) => sum + m.total, 0);
  const activeDay = days.find((d) => d.key === day);

  const submitLabel =
    group !== 'all'
      ? `Guardar grupo ${group}`
      : activeDay
        ? `Guardar ${activeDay.wk} ${activeDay.dn} ${activeDay.mon}`
        : 'Guardar pronósticos';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Fase de grupos</h2>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
          {totalDone}/{totalMatches} pronosticados
        </span>
      </div>

      {/* Filtro principal: por fecha */}
      <DragScroller className="-mx-2 flex gap-2 px-2 pb-1 pt-1">
        <button
          type="button"
          onClick={() => pickDay('all')}
          className={`flex w-[68px] shrink-0 flex-col items-center justify-center rounded-2xl border px-2 py-2.5 transition ${
            day === 'all' && group === 'all'
              ? 'border-transparent bg-emerald-600 text-white shadow-md'
              : 'border-slate-200 bg-white text-slate-500 hover:-translate-y-0.5 hover:border-emerald-300'
          }`}
        >
          <IconCalendar className="h-4 w-4" />
          <span className="mt-1 text-[10px] font-black uppercase tracking-wide">Todas</span>
        </button>
        {days.map((d) => {
          const active = d.key === day;
          const complete = d.total > 0 && d.done === d.total;
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => pickDay(d.key)}
              title={`${d.done}/${d.total} pronosticados`}
              className={`relative w-[68px] shrink-0 rounded-2xl border px-2 py-1.5 text-center transition ${
                active
                  ? 'border-transparent bg-emerald-600 text-white shadow-md'
                  : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-emerald-300'
              }`}
            >
              {complete && (
                <span
                  className={`absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-black shadow ${
                    active ? 'bg-white text-emerald-600' : 'bg-emerald-500 text-white'
                  }`}
                >
                  <IconCheck className="h-2.5 w-2.5" />
                </span>
              )}
              <span
                className={`block text-[9px] font-black uppercase tracking-widest ${
                  active ? 'text-white/75' : d.isToday ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                {d.isToday ? 'Hoy' : d.wk}
              </span>
              <span className="block text-lg font-black leading-tight">{d.dn}</span>
              <span
                className={`block text-[9px] font-bold tabular-nums ${
                  active ? 'text-white/75' : 'text-slate-400'
                }`}
              >
                {d.mon} · {d.done}/{d.total}
              </span>
            </button>
          );
        })}
      </DragScroller>

      {/* Filtro secundario: por grupo (plegado por defecto) */}
      <button
        type="button"
        onClick={() => setShowGroups(!showGroups)}
        aria-expanded={showGroups}
        className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${
          group !== 'all'
            ? `${GROUP_COLOR[group]} border-transparent text-white shadow-md`
            : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700'
        }`}
      >
        {group !== 'all' ? `Filtrando: Grupo ${group}` : 'Filtrar por grupo'}
        <IconChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${showGroups ? 'rotate-180' : ''}`}
        />
      </button>

      {showGroups && (
        <DragScroller className="-mx-2 flex gap-2 px-2 pb-2 pt-2.5">
        {meta.map(({ g, done, total, flags }) => {
          const complete = total > 0 && done === total;
          const active = g === group;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          return (
            <button
              key={g}
              type="button"
              onClick={() => (active ? pickDay(initialDay) : pickGroup(g))}
              title={`Grupo ${g} · ${done}/${total} pronosticados`}
              className={`group relative w-[92px] shrink-0 rounded-2xl border p-2.5 text-center transition ${
                active
                  ? `${GROUP_COLOR[g]} border-transparent text-white shadow-md`
                  : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow'
              }`}
            >
              {complete && (
                <span
                  className={`absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black shadow ${
                    active ? 'bg-white text-emerald-600' : 'bg-emerald-500 text-white'
                  }`}
                >
                  <IconCheck className="h-2.5 w-2.5" />
                </span>
              )}
              <span
                className={`block text-[9px] font-black uppercase tracking-widest ${
                  active ? 'text-white/70' : 'text-slate-400'
                }`}
              >
                Grupo
              </span>
              <span className="block text-xl font-black leading-tight">{g}</span>
              <span className="mt-1.5 flex items-center justify-center gap-0.5">
                {flags.map((f, i) => (
                  <Flag key={i} code={f} className="h-3 w-[18px]" />
                ))}
              </span>
              <span
                className={`mt-2 block h-1 overflow-hidden rounded-full ${
                  active ? 'bg-white/25' : 'bg-slate-100'
                }`}
              >
                <span
                  className={`block h-full rounded-full transition-all ${
                    active ? 'bg-white' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </span>
              <span
                className={`mt-1 block text-[9px] font-bold tabular-nums ${
                  active ? 'text-white/80' : 'text-slate-400'
                }`}
              >
                {done}/{total}
              </span>
            </button>
          );
        })}
        </DragScroller>
      )}

      {visible.length === 0 ? (
        <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          No hay partidos para este filtro.
        </p>
      ) : (
        <PredictionsForm
          poolId={poolId}
          formKey={`${group}-${day}`}
          submitLabel={submitLabel}
          matches={visible}
        />
      )}
    </div>
  );
}
