import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/data';
import { getAllMatches, getTeams } from '@/lib/publicData';
import {
  TournamentExplorer,
  type MatchLite,
  type TeamLite,
} from '@/components/TournamentExplorer';

type PoolRow = { id: string; name: string; type: 'global' | 'private'; code: string | null };

const KICKOFF = Date.parse('2026-06-11T19:00:00Z');

export default async function HomePage() {
  const supabase = await createClient();
  const user = await getUser();
  const daysLeft = Math.ceil((KICKOFF - Date.now()) / 86_400_000);

  // Solo MIS membresías (la RLS también permite ver las de mis compañeros de
  // polla para el ranking, así que sin este filtro saldría una tarjeta por miembro).
  const [{ data: memberships }, allMatches, allTeams] = await Promise.all([
    supabase
      .from('memberships')
      .select('pool:pools(id, name, type, code)')
      .eq('user_id', user!.id)
      .order('joined_at', { ascending: true }),
    getAllMatches(),
    getTeams(),
  ]);

  const teamsLite: TeamLite[] = allTeams.map((t) => ({
    id: t.id,
    name: t.name,
    flag: t.flag_code,
    group: t.group_letter,
  }));
  const teamMap = new Map(teamsLite.map((t) => [t.id, t]));
  const matchesLite: MatchLite[] = allMatches.map((m) => ({
    id: m.id,
    stage: m.stage,
    group: m.group_letter,
    kickoff: m.kickoff_at,
    venue: m.venue,
    status: m.status,
    hs: m.home_score,
    as: m.away_score,
    home: m.home_team_id ? (teamMap.get(m.home_team_id) ?? null) : null,
    away: m.away_team_id ? (teamMap.get(m.away_team_id) ?? null) : null,
    homeLabel: m.home_label,
    awayLabel: m.away_label,
  }));

  const pools: PoolRow[] = (memberships ?? [])
    .map((m) => (m as unknown as { pool: PoolRow }).pool)
    .filter(Boolean)
    .sort((a, b) => (a.type === 'global' ? -1 : b.type === 'global' ? 1 : 0));

  return (
    <>
      {/* Banner del torneo */}
      <div className="relative mb-8 overflow-hidden rounded-3xl">
        <Image
          src="/img/field-aerial.jpg"
          alt=""
          fill
          priority
          sizes="(max-width: 1152px) 100vw, 1152px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/95 via-emerald-900/80 to-emerald-900/40" />
        <div className="relative z-10 px-6 py-8 text-white sm:px-10 sm:py-10">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-300">
            Copa Mundial FIFA 2026 · México · EE.UU. · Canadá
          </p>
          <h2 className="mt-1 text-2xl font-black sm:text-3xl">
            {daysLeft > 1 && <>¡Faltan {daysLeft} días para el pitazo inicial! ⚽</>}
            {daysLeft === 1 && <>¡Mañana arranca el Mundial! ⚽</>}
            {daysLeft <= 0 && <>¡El Mundial está en juego! ⚽</>}
          </h2>
          <p className="mt-1 text-sm text-emerald-100">
            México vs Sudáfrica abre el torneo en el Estadio Azteca · La final es el 19 de julio
            en Nueva York.
          </p>
        </div>
      </div>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Mis pollas</h1>
          <p className="text-sm text-slate-500">
            Entra a una polla para predecir y ver el ranking.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/pollas/crear"
            className="rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-700"
          >
            + Crear polla
          </Link>
          <Link
            href="/pollas/unirse"
            className="rounded-xl border border-emerald-600 px-4 py-2.5 font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            Unirme con código
          </Link>
        </div>
      </div>

      <ul className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pools.map((pool) => (
          <li key={pool.id}>
            <Link
              href={`/pollas/${pool.id}`}
              className="flex h-full flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-2xl">{pool.type === 'global' ? '🌍' : '🔒'}</span>
                  <h2 className="mt-2 font-bold leading-tight">{pool.name}</h2>
                </div>
                {pool.code ? (
                  <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-500">
                    {pool.code}
                  </span>
                ) : (
                  <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                    Oficial
                  </span>
                )}
              </div>
              <span className="text-sm font-semibold text-emerald-700">Entrar →</span>
            </Link>
          </li>
        ))}
      </ul>

      <section>
        <div className="mb-4">
          <h2 className="text-2xl font-black tracking-tight">El torneo de un vistazo ⚽</h2>
          <p className="text-sm text-slate-500">
            Grupos, posiciones, bracket y el camino de cada selección — en vivo a medida que
            se juegan los partidos.
          </p>
        </div>
        <TournamentExplorer teams={teamsLite} matches={matchesLite} />
      </section>
    </>
  );
}
