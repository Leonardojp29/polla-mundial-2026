import Link from 'next/link';
import { getTeams } from '@/lib/publicData';
import { getFdTeams } from '@/lib/fd';
import { normTeamName, TEAM_ALIAS } from '@/lib/teamNames';
import { Flag } from '@/components/Flag';
import { GROUP_COLOR } from '@/lib/groupColors';

export const metadata = { title: 'Selecciones — Polla Mundial' };

export default async function EquiposPage() {
  const [teams, fdTeams] = await Promise.all([getTeams(), getFdTeams()]);

  // Escudo oficial por nombre normalizado (football-data → nuestra tabla).
  const crestByOurNorm = new Map<string, string | null>();
  for (const t of fdTeams) {
    const n = normTeamName(t.name);
    crestByOurNorm.set(TEAM_ALIAS[n] ?? n, t.crest);
  }

  const groups = [...new Set(teams.map((t) => t.group_letter).filter(Boolean))].sort() as string[];

  return (
    <>
      <header className="mb-8">
        <h1 className="text-3xl font-black tracking-tight">Las 48 selecciones</h1>
        <p className="mt-1 text-sm text-slate-500">
          Convocados, calendario y el camino de cada equipo — toca una selección.
        </p>
      </header>

      <div className="space-y-8">
        {groups.map((g) => (
          <section key={g}>
            <div className="mb-3 flex items-center gap-3">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black text-white ${GROUP_COLOR[g]}`}
              >
                {g}
              </span>
              <h2 className="font-bold text-slate-700">Grupo {g}</h2>
              <span className="h-px flex-1 bg-slate-200" />
            </div>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {teams
                .filter((t) => t.group_letter === g)
                .map((t) => {
                  const crest = crestByOurNorm.get(normTeamName(t.name));
                  return (
                    <li key={t.id}>
                      <Link
                        href={`/equipos/${t.id}`}
                        className="group flex h-full flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
                      >
                        {crest ? (
                          // eslint-disable-next-line @next/next/no-img-element -- escudo SVG remoto (football-data)
                          <img
                            src={crest}
                            alt=""
                            width={64}
                            height={64}
                            loading="lazy"
                            decoding="async"
                            className="h-14 w-14 object-contain drop-shadow-sm transition group-hover:scale-110"
                          />
                        ) : (
                          <Flag code={t.flag_code} className="h-10 w-14" />
                        )}
                        <span className="flex items-center gap-1.5 text-center text-sm font-bold leading-tight">
                          <Flag code={t.flag_code} className="h-3 w-[18px]" />
                          {t.name}
                        </span>
                      </Link>
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
