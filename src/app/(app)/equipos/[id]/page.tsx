import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTeams, getAllMatches, type MatchRow } from '@/lib/publicData';
import { findFdTeam, getFdTeamDetail, positionGroup, type PositionGroup } from '@/lib/fd';
import { getPlayerPhoto } from '@/lib/wikiPhotos';
import { getStadium } from '@/lib/stadiums';
import { matchDayParts } from '@/lib/dates';
import { GROUP_COLOR } from '@/lib/groupColors';
import { Flag } from '@/components/Flag';
import { Avatar } from '@/components/Avatar';
import { TrophyBadge } from '@/components/WcBadges';
import { LiveDot } from '@/components/Icons';

const GLOBAL_POOL_ID = '00000000-0000-0000-0000-000000000001';

const STAGE_LABEL: Record<string, string> = {
  group: 'Grupos',
  r32: 'Dieciseisavos',
  r16: 'Octavos',
  qf: 'Cuartos',
  sf: 'Semifinal',
  third: '3.er puesto',
  final: 'FINAL',
};

function age(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const now = new Date();
  let years = now.getFullYear() - dob.getFullYear();
  const beforeBirthday =
    now.getMonth() < dob.getMonth() ||
    (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate());
  if (beforeBirthday) years--;
  return years;
}

function TeamMatchRow({ m, teamId }: { m: MatchRow; teamId: string }) {
  const { day, time } = matchDayParts(m.kickoff_at);
  const stadium = getStadium(m.venue);
  const live = m.status === 'live';
  const finished = m.status === 'finished';
  const isHome = m.home_team_id === teamId;
  const rival = isHome ? m.away : m.home;
  const rivalLabel = isHome ? m.away_label : m.home_label;
  const ours = isHome ? m.home_score : m.away_score;
  const theirs = isHome ? m.away_score : m.home_score;
  const result =
    finished && ours !== null && theirs !== null
      ? ours > theirs
        ? { txt: 'G', cls: 'bg-emerald-500' }
        : ours < theirs
          ? { txt: 'P', cls: 'bg-red-500' }
          : { txt: 'E', cls: 'bg-slate-400' }
      : null;

  return (
    <li className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="w-24 shrink-0 text-xs font-bold uppercase tracking-wide text-slate-400">
        {STAGE_LABEL[m.stage]}
        {m.stage === 'group' && m.group_letter ? ` ${m.group_letter}` : ''}
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <Flag code={rival?.flag_code} className="h-4 w-6" />
        <span className="truncate text-sm font-semibold">
          {rival?.name ?? rivalLabel ?? 'Por definir'}
        </span>
        {!isHome && <span className="text-[10px] uppercase text-slate-300">visita</span>}
      </span>
      <span className="shrink-0 text-right">
        {live || finished ? (
          <span className="flex items-center gap-2">
            {live && <LiveDot />}
            <span className="text-lg font-black tabular-nums">
              {m.home_score ?? 0}–{m.away_score ?? 0}
            </span>
            {result && (
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black text-white ${result.cls}`}
              >
                {result.txt}
              </span>
            )}
          </span>
        ) : (
          <span className="block text-right">
            <span className="block text-sm font-bold tabular-nums text-slate-700">{time}</span>
            <span className="block text-[10px] text-slate-400">{day}</span>
          </span>
        )}
      </span>
      <span className="hidden w-40 shrink-0 truncate text-right text-xs text-slate-400 lg:block">
        {stadium ? `${stadium.stadium} · ${stadium.city}` : m.venue}
      </span>
    </li>
  );
}

export default async function EquipoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [teams, allMatches] = await Promise.all([getTeams(), getAllMatches()]);
  const team = teams.find((t) => t.id === id);
  if (!team) notFound();

  const supabase = await createClient();
  const [fdTeam, { data: statsRaw }] = await Promise.all([
    findFdTeam(team.name),
    supabase.rpc('get_pool_stats', { p_pool_id: GLOBAL_POOL_ID }),
  ]);
  const detail = fdTeam ? await getFdTeamDetail(fdTeam.id) : null;

  // Fotos de los convocados (Wikipedia, cacheadas 7 días, en paralelo).
  const squad = detail?.squad ?? [];
  const photos = await Promise.all(squad.map((p) => getPlayerPhoto(p.name)));

  const matches = allMatches
    .filter((m) => m.home_team_id === id || m.away_team_id === id)
    .sort((a, b) => Date.parse(a.kickoff_at ?? '') - Date.parse(b.kickoff_at ?? ''));

  const played = matches.filter((m) => m.status === 'finished');
  const wins = played.filter((m) => {
    const ours = m.home_team_id === id ? m.home_score : m.away_score;
    const theirs = m.home_team_id === id ? m.away_score : m.home_score;
    return ours !== null && theirs !== null && ours > theirs;
  }).length;
  const goals = played.reduce(
    (sum, m) => sum + ((m.home_team_id === id ? m.home_score : m.away_score) ?? 0),
    0,
  );

  // ¿Cuántos de la Polla Global la tienen campeona?
  const stats = (statsRaw ?? {}) as {
    with_special?: number;
    champions?: { name: string; n: number }[];
  };
  const champPick = stats.champions?.find((c) => c.name === team.name)?.n ?? 0;
  const champTotal = stats.with_special ?? 0;

  const byPosition = new Map<PositionGroup, { player: (typeof squad)[number]; photo: string | null }[]>();
  squad.forEach((player, i) => {
    const g = positionGroup(player.position);
    if (!byPosition.has(g)) byPosition.set(g, []);
    byPosition.get(g)!.push({ player, photo: photos[i] });
  });
  const POSITION_ORDER: PositionGroup[] = ['Porteros', 'Defensas', 'Mediocampistas', 'Delanteros'];

  const groupColor = team.group_letter ? GROUP_COLOR[team.group_letter] : 'bg-emerald-600';

  return (
    <>
      <Link href="/equipos" className="text-sm text-slate-500 hover:underline">
        ← Selecciones
      </Link>

      {/* Hero */}
      <header className="relative mt-3 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white">
        <div
          className={`absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-25 blur-3xl ${groupColor}`}
        />
        <div className="relative z-10 flex flex-wrap items-center gap-6 px-6 py-8 sm:px-10 sm:py-10">
          {fdTeam?.crest ? (
            // eslint-disable-next-line @next/next/no-img-element -- escudo SVG remoto (football-data)
            <img
              src={fdTeam.crest}
              alt=""
              width={112}
              height={112}
              className="h-24 w-24 object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)] sm:h-28 sm:w-28"
            />
          ) : (
            <Flag code={team.flag_code} className="h-16 w-24" />
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {team.group_letter && (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase tracking-widest text-white ${groupColor}`}
                >
                  Grupo {team.group_letter}
                </span>
              )}
              <Flag code={team.flag_code} className="h-4 w-6" />
            </div>
            <h1 className="mt-1.5 text-4xl font-black tracking-tight sm:text-5xl">{team.name}</h1>
            {detail?.coach && (
              <p className="mt-1 text-sm text-emerald-200">
                DT: <strong className="text-white">{detail.coach}</strong>
              </p>
            )}
          </div>
          <div className="ml-auto flex gap-3 text-center">
            {[
              { v: played.length, l: 'jugados' },
              { v: wins, l: 'ganados' },
              { v: goals, l: 'goles' },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl bg-white/10 px-4 py-2.5 backdrop-blur-sm">
                <p className="text-2xl font-black tabular-nums">{s.v}</p>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-200">
                  {s.l}
                </p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* El dato de la polla */}
      {champTotal > 0 && (
        <section className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 px-5 py-4">
          <TrophyBadge className="h-9 w-9" />
          <p className="text-sm text-amber-900">
            {champPick > 0 ? (
              <>
                <strong>
                  {champPick} de {champTotal}
                </strong>{' '}
                jugador{champTotal === 1 ? '' : 'es'} de la Polla Global{' '}
                {champPick === 1 ? 'la tiene' : 'la tienen'} de <strong>campeona</strong> (
                {Math.round((champPick / champTotal) * 100)}%).
              </>
            ) : (
              <>
                Nadie de la Polla Global la tiene de campeona todavía… ¿la sorpresa del torneo?
              </>
            )}
          </p>
        </section>
      )}

      {/* Calendario del equipo */}
      <section className="mt-8">
        <h2 className="mb-3 text-xl font-black tracking-tight">Su camino en el Mundial</h2>
        <ul className="space-y-2.5">
          {matches.map((m) => (
            <TeamMatchRow key={m.id} m={m} teamId={id} />
          ))}
          {matches.length === 0 && (
            <li className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Sus cruces de eliminatorias aparecerán aquí cuando se definan.
            </li>
          )}
        </ul>
      </section>

      {/* Convocados */}
      <section className="mt-8">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-xl font-black tracking-tight">Los convocados</h2>
          {squad.length > 0 && (
            <span className="text-sm text-slate-500">{squad.length} jugadores</span>
          )}
        </div>
        {squad.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
            La lista oficial de convocados aparecerá aquí apenas la publique football-data.org.
          </p>
        ) : (
          <div className="space-y-6">
            {POSITION_ORDER.filter((g) => byPosition.has(g)).map((g) => (
              <div key={g}>
                <div className="mb-2.5 flex items-center gap-3">
                  <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">
                    {g}
                  </h3>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {byPosition.get(g)!.map(({ player, photo }) => {
                    const years = age(player.dateOfBirth);
                    return (
                      <li
                        key={player.id}
                        className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
                      >
                        <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                          {photo ? (
                            // eslint-disable-next-line @next/next/no-img-element -- thumbnail remoto (Wikipedia)
                            <img
                              src={photo}
                              alt=""
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center">
                              <Avatar name={player.name} className="h-16 w-16 text-xl" />
                            </span>
                          )}
                          <Flag
                            code={team.flag_code}
                            className="absolute right-2 top-2 h-3.5 w-5 shadow"
                          />
                        </div>
                        <div className="p-3">
                          <p className="truncate text-sm font-bold leading-tight">{player.name}</p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {player.position ?? g}
                            {years !== null && <> · {years} años</>}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
