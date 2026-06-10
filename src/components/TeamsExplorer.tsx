'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Flag } from '@/components/Flag';
import { GROUP_COLOR } from '@/lib/groupColors';
import { IconSearch } from '@/components/Icons';
import { normTeamName } from '@/lib/teamNames';

export type TeamCard = {
  id: string;
  name: string;
  flag: string | null;
  group: string | null;
  crest: string | null;
  next: string | null; // "vs Brasil · jue 14:00" (hora Perú)
};

// Widget de la Home: un grupo a la vez (siempre 4 tarjetas → altura constante,
// la página nunca "salta") + buscador para llegar directo a cualquier selección.
// Clic en una tarjeta → popup con la ficha (ruta interceptada /equipos/[id]).
export function TeamsExplorer({ teams }: { teams: TeamCard[] }) {
  const [group, setGroup] = useState('A');
  const [query, setQuery] = useState('');
  const groups = [...new Set(teams.map((t) => t.group).filter(Boolean))].sort() as string[];

  const searching = query.trim().length > 0;
  const visible = searching
    ? teams.filter((t) => normTeamName(t.name).includes(normTeamName(query))).slice(0, 4)
    : teams.filter((t) => t.group === group);

  return (
    <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 p-5 shadow-lg sm:p-6">
      {/* Barra: grupos (fijos, sin scroll) + buscador */}
      <div className="flex flex-wrap items-center gap-3">
        <div className={`flex flex-wrap items-center gap-1.5 transition ${searching ? 'opacity-40' : ''}`}>
          {groups.map((g) => {
            const active = !searching && g === group;
            return (
              <button
                key={g}
                type="button"
                onClick={() => {
                  setGroup(g);
                  setQuery('');
                }}
                aria-pressed={active}
                className={`h-9 rounded-xl text-sm font-black transition-all duration-200 ${
                  active
                    ? `${GROUP_COLOR[g]} px-3.5 text-white shadow-lg`
                    : 'w-9 bg-white/10 text-emerald-100/70 hover:bg-white/20 hover:text-white'
                }`}
              >
                {active ? (
                  <span className="whitespace-nowrap text-xs uppercase tracking-wider">
                    Grupo {g}
                  </span>
                ) : (
                  g
                )}
              </button>
            );
          })}
        </div>
        <label className="relative ml-auto w-full sm:w-60">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-200/50" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca una selección…"
            className="w-full rounded-xl border border-white/10 bg-white/10 py-2 pl-9 pr-3 text-sm font-medium text-white placeholder-emerald-100/40 outline-none transition focus:border-emerald-400/60 focus:bg-white/15"
          />
        </label>
      </div>

      {/* Tarjetas (siempre el mismo alto) */}
      <div className="mt-5 grid min-h-[180px] grid-cols-2 content-start gap-3 lg:grid-cols-4">
        {visible.map((t) => (
          <Link
            key={t.id}
            href={`/equipos/${t.id}`}
            className="group flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:-translate-y-0.5 hover:border-emerald-400/40 hover:bg-white/10"
          >
            {t.crest ? (
              <Image
                src={t.crest}
                alt=""
                width={64}
                height={64}
                className="h-14 w-14 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition duration-300 group-hover:scale-110"
              />
            ) : (
              <Flag code={t.flag} className="h-9 w-14" />
            )}
            <span className="max-w-full truncate text-center text-sm font-bold text-white">
              {t.name}
            </span>
            <span className="w-full truncate text-center text-[11px] text-emerald-200/70">
              {t.next ?? 'Sin próximos partidos'}
            </span>
            {searching && t.group && (
              <span
                className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white ${GROUP_COLOR[t.group]}`}
              >
                Grupo {t.group}
              </span>
            )}
          </Link>
        ))}
        {searching && visible.length === 0 && (
          <p className="col-span-2 self-center text-center text-sm text-emerald-100/60 lg:col-span-4">
            Ninguna selección coincide con “{query}”.
          </p>
        )}
      </div>
    </div>
  );
}
