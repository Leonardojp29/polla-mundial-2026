import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/data';
import { getAllMatches, getTeams, type MatchRow, type Team } from '@/lib/publicData';
import { saveResult, clearResult, setMatchTeams, recalcSpecials } from '@/lib/actions/admin';
import { Flag } from '@/components/Flag';
import { IconSettings, IconStar } from '@/components/Icons';

const STAGE_LABEL: Record<MatchRow['stage'], string> = {
  group: 'Grupos',
  r32: 'Dieciseisavos',
  r16: 'Octavos',
  qf: 'Cuartos',
  sf: 'Semifinal',
  third: '3.er puesto',
  final: 'FINAL',
};

const scoreInput =
  'h-10 w-14 rounded-lg border border-slate-300 text-center font-bold tabular-nums outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200';

function TeamPicker({
  name,
  teams,
  defaultValue,
  label,
}: {
  name: string;
  teams: Team[];
  defaultValue: string;
  label: string;
}) {
  return (
    <select
      name={name}
      required
      defaultValue={defaultValue}
      aria-label={label}
      className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm outline-none focus:border-emerald-500"
    >
      <option value="">— {label} —</option>
      {teams.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name} ({t.group_letter})
        </option>
      ))}
    </select>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    ok?: string;
    reopened?: string;
    teams?: string;
    specials?: string;
    error?: string;
  }>;
}) {
  const [profile, sp] = await Promise.all([getProfile(), searchParams]);
  if (profile?.role !== 'admin') redirect('/');

  const [matches, teams] = await Promise.all([getAllMatches(), getTeams()]);

  // Agrupar por día (hora de Colombia).
  const byDay = new Map<string, MatchRow[]>();
  for (const m of matches) {
    const day = m.kickoff_at
      ? new Date(m.kickoff_at).toLocaleDateString('es-PE', {
          timeZone: 'America/Lima',
          weekday: 'long',
          day: '2-digit',
          month: 'long',
        })
      : 'Sin fecha';
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(m);
  }

  const finished = matches.filter((m) => m.status === 'finished').length;

  return (
    <>
      <header className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="flex items-center gap-2.5 text-3xl font-black tracking-tight"><IconSettings className="h-7 w-7 text-slate-500" /> Panel admin</h1>
          <Link
            href="/admin/usuarios"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700"
          >
            Ver usuarios registrados →
          </Link>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Carga los resultados reales: al guardar, se recalculan los puntos de todas las pollas
          al instante. · <strong>{finished}/104</strong> partidos finalizados
        </p>
      </header>

      {sp.error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{sp.error}</p>
      )}
      {sp.ok && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          Resultado guardado y puntos recalculados.
        </p>
      )}
      {sp.reopened && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
          Partido reabierto: resultado y puntos borrados.
        </p>
      )}
      {sp.teams && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          Equipos del cruce asignados: la llave ya se puede predecir.
        </p>
      )}
      {sp.specials && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          Puntos del pronóstico maestro recalculados en todas las pollas.
        </p>
      )}

      {/* Pronósticos maestros — DESACTIVADO (11 jun): la polla es solo de
          predicciones de partidos. Se reactiva descomentando este bloque.
      <section className="mb-8 rounded-2xl border border-violet-200 bg-violet-50/60 p-5">
        <h2 className="flex items-center gap-2 font-bold text-violet-900"><IconStar className="h-4 w-4 text-violet-500" /> Pronósticos maestros</h2>
        <p className="mt-1 text-sm text-violet-700">
          Recalcula los puntos de campeón/finalista/semifinalistas/grupos con lo decidido hasta
          ahora. El goleador se escribe aquí cuando se conozca (debe coincidir con el nombre que
          escribieron los jugadores).
        </p>
        <form action={recalcSpecials} className="mt-3 flex flex-wrap items-center gap-3">
          <input
            name="top_scorer"
            placeholder="Goleador real (opcional)"
            className="w-64 rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400"
          />
          <button
            type="submit"
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            Recalcular puntos especiales
          </button>
        </form>
      </section>
      */}

      <div className="space-y-8">
        {[...byDay.entries()].map(([day, dayMatches]) => (
          <section key={day}>
            <h2 className="sticky top-14 z-[5] -mx-4 mb-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2 text-sm font-bold uppercase tracking-wide text-slate-500 backdrop-blur sm:-mx-6 sm:px-6">
              {day}
            </h2>
            <ul className="space-y-2">
              {dayMatches.map((m) => {
                const tbd = !m.home || !m.away;
                return (
                  <li
                    key={m.id}
                    className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="w-24 shrink-0 text-xs font-semibold text-slate-400">
                        {STAGE_LABEL[m.stage]}
                        {m.group_letter && ` · ${m.group_letter}`}
                      </span>

                      {tbd ? (
                        <form
                          action={setMatchTeams}
                          className="flex flex-1 flex-wrap items-center gap-2"
                        >
                          <input type="hidden" name="match_id" value={m.id} />
                          <span className="text-sm italic text-slate-400">
                            {m.home_label ?? '?'} vs {m.away_label ?? '?'}:
                          </span>
                          <TeamPicker name="home_team" teams={teams} defaultValue="" label="local" />
                          <span className="text-slate-300">vs</span>
                          <TeamPicker name="away_team" teams={teams} defaultValue="" label="visitante" />
                          <button
                            type="submit"
                            className="rounded-lg border border-emerald-600 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                          >
                            Asignar equipos
                          </button>
                        </form>
                      ) : (
                        <form
                          action={saveResult}
                          className="flex flex-1 flex-wrap items-center gap-3"
                        >
                          <input type="hidden" name="match_id" value={m.id} />
                          <span className="flex min-w-32 flex-1 items-center justify-end gap-2 text-right text-sm font-semibold">
                            {m.home!.name}
                            <Flag code={m.home!.flag_code} className="h-5 w-7" />
                          </span>
                          <span className="flex items-center gap-1.5">
                            <input
                              type="number" min={0} max={99} required
                              name="home_score"
                              defaultValue={m.home_score ?? ''}
                              aria-label={`Goles de ${m.home!.name}`}
                              className={scoreInput}
                            />
                            <span className="text-slate-300">–</span>
                            <input
                              type="number" min={0} max={99} required
                              name="away_score"
                              defaultValue={m.away_score ?? ''}
                              aria-label={`Goles de ${m.away!.name}`}
                              className={scoreInput}
                            />
                          </span>
                          <span className="flex min-w-32 flex-1 items-center gap-2 text-sm font-semibold">
                            <Flag code={m.away!.flag_code} className="h-5 w-7" />
                            {m.away!.name}
                          </span>
                          <button
                            type="submit"
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                          >
                            {m.status === 'finished' ? 'Corregir' : 'Guardar'}
                          </button>
                        </form>
                      )}

                      {m.status === 'finished' && (
                        <form action={clearResult}>
                          <input type="hidden" name="match_id" value={m.id} />
                          <button
                            type="submit"
                            title="Reabrir partido (borra resultado y puntos)"
                            className="rounded-lg border border-amber-300 px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-50"
                          >
                            ↩️ Reabrir
                          </button>
                        </form>
                      )}
                    </div>

                    {m.stage !== 'group' && !tbd && m.status !== 'finished' && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-600">
                          Corregir equipos del cruce
                        </summary>
                        <form
                          action={setMatchTeams}
                          className="mt-2 flex flex-wrap items-center gap-2"
                        >
                          <input type="hidden" name="match_id" value={m.id} />
                          <TeamPicker
                            name="home_team"
                            teams={teams}
                            defaultValue={m.home_team_id ?? ''}
                            label="local"
                          />
                          <span className="text-slate-300">vs</span>
                          <TeamPicker
                            name="away_team"
                            teams={teams}
                            defaultValue={m.away_team_id ?? ''}
                            label="visitante"
                          />
                          <button
                            type="submit"
                            className="rounded-lg border border-emerald-600 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                          >
                            Guardar equipos
                          </button>
                        </form>
                      </details>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
