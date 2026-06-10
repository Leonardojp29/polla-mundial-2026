'use client';

import { useState } from 'react';
import { Flag } from '@/components/Flag';
import { IconCheck } from '@/components/Icons';
import { DragScroller } from '@/components/DragScroller';
import { GROUP_COLOR } from '@/lib/groupColors';
import { PredictionsForm, type MatchVM } from '@/components/PredictionsForm';

export type GroupMeta = {
  g: string;
  done: number;
  total: number;
  flags: (string | null)[];
};

// Los 72 partidos llegan de una vez desde el servidor (pocos KB) y el cambio de
// grupo es 100% en el cliente: instantáneo, sin viajes a la red.
export function GroupsPredictions({
  poolId,
  initialGroup,
  meta,
  matchesByGroup,
}: {
  poolId: string;
  initialGroup: string;
  meta: GroupMeta[];
  matchesByGroup: Record<string, MatchVM[]>;
}) {
  const [selected, setSelected] = useState(initialGroup);
  const totalDone = meta.reduce((sum, m) => sum + m.done, 0);
  const totalMatches = meta.reduce((sum, m) => sum + m.total, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Fase de grupos</h2>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
          {totalDone}/{totalMatches} pronosticados
        </span>
      </div>

      <DragScroller className="-mx-2 flex gap-2 px-2 pb-2 pt-2.5">
        {meta.map(({ g, done, total, flags }) => {
          const complete = total > 0 && done === total;
          const active = g === selected;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          return (
            <button
              key={g}
              type="button"
              onClick={() => setSelected(g)}
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
                  <IconCheck className="h-3 w-3" />
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

      <PredictionsForm
        poolId={poolId}
        formKey={selected}
        submitLabel={`Guardar grupo ${selected}`}
        matches={matchesByGroup[selected] ?? []}
      />
    </div>
  );
}
