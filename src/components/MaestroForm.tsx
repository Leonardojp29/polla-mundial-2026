'use client';

import { useActionState } from 'react';
import { saveSpecial, type SpecialState } from '@/lib/actions/special';
import type { Team } from '@/lib/publicData';

export type SpecialVM = {
  champion: string | null;
  runnerUp: string | null;
  semis: string[];
  topScorer: string | null;
  groupWinners: Record<string, { first: string; second: string }>;
  points: number | null;
};

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

const selectCls =
  'w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 disabled:bg-slate-100 disabled:text-slate-400';

function TeamOptions({ teams }: { teams: Team[] }) {
  return (
    <>
      <option value="">— elegir —</option>
      {teams.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name} ({t.group_letter})
        </option>
      ))}
    </>
  );
}

export function MaestroForm({
  poolId,
  teams,
  current,
  locked,
  deadlineLabel,
}: {
  poolId: string;
  teams: Team[];
  current: SpecialVM;
  locked: boolean;
  deadlineLabel: string | null;
}) {
  const [state, formAction, pending] = useActionState<SpecialState, FormData>(saveSpecial, {});

  const byGroup = new Map<string, Team[]>();
  for (const g of GROUPS) byGroup.set(g, []);
  for (const t of teams) if (t.group_letter) byGroup.get(t.group_letter)?.push(t);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="pool_id" value={poolId} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">⭐ Pronóstico maestro</h2>
        {current.points !== null && (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
            +{current.points} pts ganados
          </span>
        )}
      </div>

      {locked ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          🔒 El pronóstico maestro cerró al iniciar el torneo. Esto fue lo que elegiste.
        </p>
      ) : (
        <p className="rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-800">
          Estos pronósticos se hacen <strong>una sola vez</strong> y cierran el{' '}
          <strong>{deadlineLabel}</strong>: campeón (25 pts), finalista (15), cada
          semifinalista (8), goleador (15), 1.º de grupo (3 c/u) y 2.º (2 c/u).
        </p>
      )}

      {/* Campeón / finalista / goleador */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-bold">🏆 El podio</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="champion" className="mb-1 block text-sm font-medium">
              Campeón <span className="text-xs text-emerald-600">(25 pts)</span>
            </label>
            <select id="champion" name="champion" disabled={locked} defaultValue={current.champion ?? ''} className={selectCls}>
              <TeamOptions teams={teams} />
            </select>
          </div>
          <div>
            <label htmlFor="runner_up" className="mb-1 block text-sm font-medium">
              Finalista <span className="text-xs text-emerald-600">(15 pts)</span>
            </label>
            <select id="runner_up" name="runner_up" disabled={locked} defaultValue={current.runnerUp ?? ''} className={selectCls}>
              <TeamOptions teams={teams} />
            </select>
          </div>
          <div>
            <label htmlFor="top_scorer" className="mb-1 block text-sm font-medium">
              Goleador <span className="text-xs text-emerald-600">(15 pts)</span>
            </label>
            <input
              id="top_scorer"
              name="top_scorer"
              disabled={locked}
              defaultValue={current.topScorer ?? ''}
              placeholder="Ej. Kylian Mbappé"
              className={selectCls}
            />
          </div>
        </div>
      </section>

      {/* Semifinalistas */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-1 font-bold">🔥 Los 4 semifinalistas</h3>
        <p className="mb-4 text-xs text-slate-500">8 pts por cada acierto, sin importar el orden.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <select
              key={i}
              name={`semi-${i}`}
              disabled={locked}
              defaultValue={current.semis[i - 1] ?? ''}
              aria-label={`Semifinalista ${i}`}
              className={selectCls}
            >
              <TeamOptions teams={teams} />
            </select>
          ))}
        </div>
      </section>

      {/* 1.º y 2.º por grupo */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-1 font-bold">📋 Clasificados por grupo</h3>
        <p className="mb-4 text-xs text-slate-500">
          1.º del grupo: 3 pts · 2.º del grupo: 2 pts. Puedes dejar grupos sin llenar.
        </p>
        <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
          {GROUPS.map((g) => {
            const groupTeams = byGroup.get(g) ?? [];
            const gw = current.groupWinners?.[g];
            return (
              <div key={g} className="rounded-xl border border-slate-100 p-3">
                <p className="mb-2 text-sm font-bold text-slate-600">Grupo {g}</p>
                <div className="space-y-2">
                  {[
                    { n: 1, label: '1.º', def: gw?.first ?? '' },
                    { n: 2, label: '2.º', def: gw?.second ?? '' },
                  ].map(({ n, label, def }) => (
                    <div key={n} className="flex items-center gap-2">
                      <span className="w-6 shrink-0 text-xs font-semibold text-slate-400">{label}</span>
                      <select
                        name={`gw-${g}-${n}`}
                        disabled={locked}
                        defaultValue={def}
                        aria-label={`${label} del grupo ${g}`}
                        className={selectCls}
                      >
                        <option value="">— elegir —</option>
                        {groupTeams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {(state.ok || state.error) && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            state.error ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {state.ok ?? state.error}
        </p>
      )}

      {!locked && (
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60 sm:w-auto sm:px-8"
        >
          {pending ? 'Guardando…' : 'Guardar pronóstico maestro'}
        </button>
      )}
    </form>
  );
}
