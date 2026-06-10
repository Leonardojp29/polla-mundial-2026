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
import { Countdown } from '@/components/Countdown';
import { MatchCenter, type MyPredMap } from '@/components/MatchCenter';
import { MissingAlert, type MissingPool } from '@/components/MissingAlert';
import { openMatches, missingFor, closeLabel } from '@/lib/missing';
import { IconLock } from '@/components/Icons';
import { GlobalBadge } from '@/components/WcBadges';
import { getStadium } from '@/lib/stadiums';

const GLOBAL_POOL_ID = '00000000-0000-0000-0000-000000000001';

type PoolRow = { id: string; name: string; type: 'global' | 'private'; code: string | null };

export default async function HomePage() {
  const supabase = await createClient();
  const user = await getUser();

  // Solo MIS membresías (la RLS también permite ver las de mis compañeros de
  // polla para el ranking, así que sin este filtro saldría una tarjeta por miembro).
  const [{ data: memberships }, { data: myPredictions }, allMatches, allTeams] =
    await Promise.all([
      supabase
        .from('memberships')
        .select('pool:pools(id, name, type, code)')
        .eq('user_id', user!.id)
        .order('joined_at', { ascending: true }),
      supabase
        .from('predictions')
        .select('pool_id, match_id, pred_home_score, pred_away_score')
        .eq('user_id', user!.id),
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

  // Inicio del torneo: el primer kickoff de la base (no una fecha quemada).
  const firstKickoff = allMatches.find((m) => m.kickoff_at)?.kickoff_at ?? null;
  const started = !!firstKickoff && Date.parse(firstKickoff) <= Date.now();

  // El hero muestra el estadio del partido en vivo (o del próximo por jugarse).
  const heroMatch =
    matchesLite.find((m) => m.status === 'live') ??
    matchesLite
      .filter((m) => m.status === 'scheduled' && m.kickoff && Date.parse(m.kickoff) > Date.now())
      .sort((a, b) => Date.parse(a.kickoff!) - Date.parse(b.kickoff!))[0] ??
    null;
  const heroStadium = getStadium(heroMatch?.venue);
  const heroLive = heroMatch?.status === 'live';

  // Pronósticos pendientes por polla.
  const open = openMatches(allMatches);
  const predictedByPool = new Map<string, Set<number>>();
  for (const p of myPredictions ?? []) {
    if (!predictedByPool.has(p.pool_id)) predictedByPool.set(p.pool_id, new Set());
    predictedByPool.get(p.pool_id)!.add(p.match_id);
  }
  const missingPools: MissingPool[] = pools.map((pool) => {
    const info = missingFor(open, predictedByPool.get(pool.id) ?? new Set());
    return {
      poolId: pool.id,
      poolName: pool.name,
      count: info.count,
      closeLabel: closeLabel(info.nextCloseIso),
    };
  });

  // Mi pronóstico por partido (el de la Polla Global) para el Match Center.
  const myPreds: MyPredMap = {};
  for (const p of myPredictions ?? []) {
    if (p.pool_id === GLOBAL_POOL_ID) {
      myPreds[p.match_id] = { h: p.pred_home_score, a: p.pred_away_score };
    }
  }

  return (
    <>
      {/* Banner del torneo */}
      <div className="relative mb-8 overflow-hidden rounded-3xl">
        <Image
          src={heroStadium?.img ?? '/img/wc26/hero-azteca.webp'}
          alt={heroStadium ? `${heroStadium.stadium}, ${heroStadium.city}` : 'Estadio Azteca'}
          fill
          priority
          sizes="(max-width: 1152px) 100vw, 1152px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-emerald-950/60 to-transparent" />
        <div className="relative z-10 px-6 py-8 text-white sm:px-10 sm:py-10">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-300">
            Copa Mundial FIFA 2026 · México · EE.UU. · Canadá
          </p>
          {started || !firstKickoff ? (
            <>
              <h2 className="mt-1 text-2xl font-black sm:text-3xl">
                {heroLive ? '¡Se está jugando ahora!' : '¡El Mundial está en juego!'}
              </h2>
              <p className="mt-1 text-sm text-emerald-100">
                {heroMatch && heroStadium ? (
                  <>
                    {heroMatch.home?.name ?? heroMatch.homeLabel} vs{' '}
                    {heroMatch.away?.name ?? heroMatch.awayLabel}
                    {heroLive ? ' se juega en ' : ' viene en '}
                    <strong className="text-white">{heroStadium.stadium}</strong>,{' '}
                    {heroStadium.city}.
                  </>
                ) : (
                  <>Los marcadores y el ranking se actualizan en vivo · La final es el 19 de julio en Nueva York.</>
                )}
              </p>
            </>
          ) : (
            <>
              <h2 className="mt-1 text-2xl font-black sm:text-3xl">
                El pitazo inicial se acerca
              </h2>
              <p className="mb-4 mt-1 text-sm text-emerald-100">
                {heroMatch && heroStadium ? (
                  <>
                    {heroMatch.home?.name ?? heroMatch.homeLabel} vs{' '}
                    {heroMatch.away?.name ?? heroMatch.awayLabel} abre el torneo en el{' '}
                    <strong className="text-white">{heroStadium.stadium}</strong> · La final es
                    el 19 de julio en Nueva York.
                  </>
                ) : (
                  <>México vs Sudáfrica abre el torneo en el Estadio Azteca · La final es el 19 de julio en Nueva York.</>
                )}
              </p>
              <Countdown targetIso={firstKickoff} />
            </>
          )}
          {heroStadium && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1 text-xs font-semibold text-emerald-100 backdrop-blur-sm">
              {heroStadium.stadium} · {heroStadium.city}
            </p>
          )}
        </div>
      </div>

      <MissingAlert pools={missingPools} />

      <MatchCenter matches={matchesLite} myPreds={myPreds} />

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
                  {pool.type === 'global' ? (
                    <GlobalBadge className="h-10 w-10" />
                  ) : (
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <IconLock className="h-5 w-5" />
                    </span>
                  )}
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
          <h2 className="text-2xl font-black tracking-tight">El torneo de un vistazo</h2>
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
