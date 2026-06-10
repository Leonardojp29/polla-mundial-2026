'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Flag } from '@/components/Flag';
import { GROUP_COLOR } from '@/lib/groupColors';
import { IconCalendar, IconSearch, LiveDot } from '@/components/Icons';
import { normTeamName } from '@/lib/teamNames';
import { AddToCalendar } from '@/components/AddToCalendar';

export type CalendarMatch = {
  id: number;
  stage: string;
  stageLabel: string;
  group: string | null;
  day: string; // "Jueves, 11 de junio"
  time: string; // "14:00" hora Perú
  isToday: boolean;
  status: 'scheduled' | 'live' | 'finished';
  hs: number | null;
  as: number | null;
  homeName: string;
  homeFlag: string | null;
  awayName: string;
  awayFlag: string | null;
  stadium: string | null;
  city: string | null;
  gcalUrl: string | null;
};

const PHASES: { key: string; label: string; stages: string[] }[] = [
  { key: 'all', label: 'Todo', stages: [] },
  { key: 'group', label: 'Grupos', stages: ['group'] },
  { key: 'ko', label: 'Eliminatorias', stages: ['r32', 'r16', 'qf', 'sf', 'third', 'final'] },
];

// Calendario: 104 partidos por día (hora Perú), filtro por fase y buscador —
// todo en el cliente, instantáneo. Colapsado muestra los próximos 3 días de
// partidos; "Ver calendario completo" expande el resto.
export function CalendarList({ matches }: { matches: CalendarMatch[] }) {
  const [phase, setPhase] = useState('all');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);

  const stages = PHASES.find((p) => p.key === phase)?.stages ?? [];
  const q = normTeamName(query);
  const visible = matches.filter(
    (m) =>
      (stages.length === 0 || stages.includes(m.stage)) &&
      (q === '' || normTeamName(m.homeName).includes(q) || normTeamName(m.awayName).includes(q)),
  );

  // Agrupar por día (vienen ordenados por kickoff).
  const allDays: { day: string; isToday: boolean; items: CalendarMatch[] }[] = [];
  for (const m of visible) {
    const last = allDays[allDays.length - 1];
    if (last && last.day === m.day) last.items.push(m);
    else allDays.push({ day: m.day, isToday: m.isToday, items: [m] });
  }

  // Colapsado: desde el primer día con partidos pendientes (hoy o futuro), 3 días.
  const filtering = q !== '' || phase !== 'all';
  let days = allDays;
  let hiddenDays = 0;
  if (!expanded && !filtering) {
    let start = allDays.findIndex((d) => d.items.some((m) => m.status !== 'finished'));
    if (start < 0) start = Math.max(0, allDays.length - 3);
    days = allDays.slice(start, start + 3);
    hiddenDays = allDays.length - days.length;
  }

  return (
    <div className="space-y-5">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        {PHASES.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPhase(p.key)}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
              phase === p.key
                ? 'bg-emerald-600 text-white shadow-md'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700'
            }`}
          >
            {p.label}
          </button>
        ))}
        <label className="relative ml-auto w-full sm:w-64">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtra por selección…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          />
        </label>
        {visible.length > 0 && (
          // Siempre popup Google/Apple: el filtro (fase y/o búsqueda) es parte
          // del feed, así que la suscripción trae exactamente lo filtrado.
          <AddToCalendar
            mode="subscribe"
            icsPath={`/api/ics/torneo${(() => {
              const p = new URLSearchParams({
                ...(phase !== 'all' ? { fase: phase === 'group' ? 'group' : 'ko' } : {}),
                ...(q !== '' ? { q: query.trim() } : {}),
              }).toString();
              return p ? `?${p}` : '';
            })()}`}
            label={`Agregar estos ${visible.length} al calendario`}
          />
        )}
      </div>

      {days.length === 0 && (
        <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          Ningún partido coincide con el filtro.
        </p>
      )}

      {days.map((d) => (
        <section key={d.day}>
          <div className="mb-2 flex items-center gap-3">
            <h2 className="flex items-center gap-1.5 text-sm font-black uppercase tracking-wide text-slate-700">
              <IconCalendar className="h-4 w-4 text-emerald-600" /> {d.day}
            </h2>
            {d.isToday && (
              <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-white">
                Hoy
              </span>
            )}
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <ul className="space-y-1.5">
            {d.items.map((m) => (
              <li key={m.id} className="relative">
                <Link
                  href={`/partidos/${m.id}`}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-12 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
                >
                  <span
                    className={`w-16 shrink-0 rounded-md px-1.5 py-0.5 text-center text-[9px] font-black uppercase tracking-wide text-white ${
                      m.group ? GROUP_COLOR[m.group] : 'bg-slate-600'
                    }`}
                  >
                    {m.group ? `Grupo ${m.group}` : m.stageLabel}
                  </span>
                  <span className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
                    <span className="truncate text-right text-sm font-semibold">{m.homeName}</span>
                    <Flag code={m.homeFlag} className="h-3.5 w-5" />
                  </span>
                  <span className="shrink-0 text-center">
                    {m.status === 'scheduled' ? (
                      <span className="block w-14 text-sm font-black tabular-nums text-slate-700">
                        {m.time}
                      </span>
                    ) : (
                      <span className="flex w-14 items-center justify-center gap-1">
                        {m.status === 'live' && <LiveDot />}
                        <span className="text-sm font-black tabular-nums">
                          {m.hs}–{m.as}
                        </span>
                      </span>
                    )}
                  </span>
                  <span className="flex min-w-0 flex-1 items-center gap-1.5">
                    <Flag code={m.awayFlag} className="h-3.5 w-5" />
                    <span className="truncate text-sm font-semibold">{m.awayName}</span>
                  </span>
                  <span className="hidden w-44 shrink-0 truncate text-right text-xs text-slate-400 lg:block">
                    {m.stadium ? `${m.stadium} · ${m.city}` : ''}
                  </span>
                </Link>
                {m.gcalUrl && (
                  // -mt-3.5 en vez de translate: el transform creaba un stacking
                  // context que dejaba el menú detrás de los íconos siguientes.
                  <span className="absolute right-2 top-1/2 -mt-3.5">
                    <AddToCalendar
                      mode="event"
                      compact
                      icsPath={`/api/ics/partido/${m.id}`}
                      googleUrl={m.gcalUrl}
                    />
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {hiddenDays > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50"
        >
          Ver calendario completo ({hiddenDays} día{hiddenDays === 1 ? '' : 's'} más) ↓
        </button>
      )}
      {expanded && !filtering && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
        >
          Mostrar menos ↑
        </button>
      )}
    </div>
  );
}
