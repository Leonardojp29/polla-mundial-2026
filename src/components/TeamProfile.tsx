import { existsSync } from 'node:fs';
import { join } from 'node:path';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTeams, getAllMatches, type MatchRow } from '@/lib/publicData';
import { findFdTeam, getFdTeamDetail, positionGroup, type PositionGroup } from '@/lib/fd';
import { getStadium, type StadiumInfo } from '@/lib/stadiums';
import { matchDayParts } from '@/lib/dates';
import { GROUP_COLOR } from '@/lib/groupColors';
import { esTeamName } from '@/lib/teamNames';
import { Flag } from '@/components/Flag';
import { TrophyBadge } from '@/components/WcBadges';
import { LiveDot } from '@/components/Icons';
import { AddToCalendar } from '@/components/AddToCalendar';

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

function shortDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-PE', {
    timeZone: 'America/Lima',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}

function TeamMatchRow({ m, teamId }: { m: MatchRow; teamId: string }) {
  const { time } = matchDayParts(m.kickoff_at);
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
    <li>
      <Link
        href={`/partidos/${m.id}`}
        className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
      >
      <span className="w-16 shrink-0 text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {STAGE_LABEL[m.stage]}
        {m.stage === 'group' && m.group_letter ? ` ${m.group_letter}` : ''}
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        <Flag code={rival?.flag_code} className="h-3.5 w-5" />
        <span className="truncate text-xs font-semibold">
          {rival?.name ?? rivalLabel ?? 'Por definir'}
        </span>
      </span>
      <span className="shrink-0 text-right">
        {live || finished ? (
          <span className="flex items-center gap-1.5">
            {live && <LiveDot />}
            <span className="text-sm font-black tabular-nums">
              {m.home_score ?? 0}–{m.away_score ?? 0}
            </span>
            {result && (
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-black text-white ${result.cls}`}
              >
                {result.txt}
              </span>
            )}
          </span>
        ) : (
          <span className="text-[11px] text-slate-500">
            <span className="font-bold tabular-nums text-slate-700">{time}</span> ·{' '}
            {shortDate(m.kickoff_at)}
          </span>
        )}
      </span>
      </Link>
    </li>
  );
}

type StadiumGames = StadiumInfo & {
  games: { rivalName: string; rivalFlag: string | null; date: string }[];
};

// Ficha completa de una selección, compacta: cabe sin scroll en el popup a
// zoom 100%. La usan la página /equipos/[id] y el modal interceptado.
export async function TeamProfile({ id }: { id: string }) {
  const [teams, allMatches] = await Promise.all([getTeams(), getAllMatches()]);
  const team = teams.find((t) => t.id === id);
  if (!team) notFound();

  const supabase = await createClient();
  const [fdTeam, { data: statsRaw }] = await Promise.all([
    findFdTeam(team.name),
    supabase.rpc('get_pool_stats', { p_pool_id: GLOBAL_POOL_ID }),
  ]);
  const detail = fdTeam ? await getFdTeamDetail(fdTeam.id) : null;
  const squad = detail?.squad ?? [];

  // Foto oficial del plantel (opcional, curada a mano): public/img/teams/<id>.webp
  const teamPhoto = existsSync(join(process.cwd(), 'public', 'img', 'teams', `${id}.webp`))
    ? `/img/teams/${id}.webp`
    : null;

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

  // Estadios donde jugará, con rival y fecha de cada partido.
  const stadiums: StadiumGames[] = [];
  for (const m of matches) {
    const info = getStadium(m.venue);
    if (!info) continue;
    const isHome = m.home_team_id === id;
    const rival = isHome ? m.away : m.home;
    const rivalLabel = isHome ? m.away_label : m.home_label;
    const game = {
      rivalName: rival?.name ?? rivalLabel ?? 'Por definir',
      rivalFlag: rival?.flag_code ?? null,
      date: shortDate(m.kickoff_at),
    };
    const existing = stadiums.find((s) => s.img === info.img);
    if (existing) existing.games.push(game);
    else stadiums.push({ ...info, games: [game] });
  }

  // ¿Cuántos de la Polla Global la tienen campeona?
  const stats = (statsRaw ?? {}) as {
    with_special?: number;
    champions?: { name: string; n: number }[];
  };
  // Los nombres del RPC vienen en inglés (BD); el de team ya está en español.
  const champPick = stats.champions?.find((c) => esTeamName(c.name) === team.name)?.n ?? 0;
  const champTotal = stats.with_special ?? 0;

  const byPosition = new Map<PositionGroup, typeof squad>();
  for (const player of squad) {
    const g = positionGroup(player.position);
    if (!byPosition.has(g)) byPosition.set(g, []);
    byPosition.get(g)!.push(player);
  }
  const POSITION_ORDER: PositionGroup[] = ['Porteros', 'Defensas', 'Mediocampistas', 'Delanteros'];

  const groupColor = team.group_letter ? GROUP_COLOR[team.group_letter] : 'bg-emerald-600';

  return (
    <div className="space-y-3.5">
      {/* Hero compacto */}
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white">
        {teamPhoto && (
          <>
            <Image
              src={teamPhoto}
              alt={`Plantel de ${team.name}`}
              fill
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-emerald-950/70 to-slate-950/40" />
          </>
        )}
        <div
          className={`absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-25 blur-3xl ${groupColor}`}
        />
        <div className="relative z-10 flex flex-wrap items-center gap-4 px-5 py-4">
          {fdTeam?.crest ? (
            // eslint-disable-next-line @next/next/no-img-element -- escudo SVG remoto (football-data)
            <img
              src={fdTeam.crest}
              alt=""
              width={64}
              height={64}
              className="h-14 w-14 object-contain drop-shadow-[0_6px_18px_rgba(0,0,0,0.5)]"
            />
          ) : (
            <Flag code={team.flag_code} className="h-10 w-15" />
          )}
          <div className="min-w-0">
            {team.group_letter && (
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white ${groupColor}`}
              >
                Grupo {team.group_letter}
              </span>
            )}
            <h1 className="text-2xl font-black leading-tight tracking-tight sm:text-3xl">
              {team.name}
            </h1>
            {detail?.coach && (
              <p className="text-xs text-emerald-200">
                DT: <strong className="text-white">{detail.coach}</strong>
              </p>
            )}
          </div>
          <div className="ml-auto flex gap-2 text-center">
            {[
              { v: played.length, l: 'jugados' },
              { v: wins, l: 'ganados' },
              { v: goals, l: 'goles' },
            ].map((s) => (
              <div key={s.l} className="rounded-xl bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                <p className="text-lg font-black leading-tight tabular-nums">{s.v}</p>
                <p className="text-[8px] font-semibold uppercase tracking-widest text-emerald-200">
                  {s.l}
                </p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* El dato de la polla */}
      {champTotal > 0 && (
        <section className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 px-4 py-2">
          <TrophyBadge className="h-6 w-6" />
          <p className="text-xs text-amber-900">
            {champPick > 0 ? (
              <>
                <strong>
                  {champPick} de {champTotal}
                </strong>{' '}
                de la Polla Global {champPick === 1 ? 'la tiene' : 'la tienen'} de{' '}
                <strong>campeona</strong> ({Math.round((champPick / champTotal) * 100)}%).
              </>
            ) : (
              <>Nadie de la Polla Global la tiene de campeona todavía… ¿la sorpresa del torneo?</>
            )}
          </p>
        </section>
      )}

      {/* Estadios donde jugará (con rival y fecha) */}
      {stadiums.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-black tracking-tight">Estadios donde jugará</h2>
          <ul className="grid gap-2 sm:grid-cols-3">
            {stadiums.map((s) => (
              <li
                key={s.img}
                className="flex items-stretch gap-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- webp local optimizado */}
                <img
                  src={s.img}
                  alt={s.stadium}
                  loading="lazy"
                  decoding="async"
                  className="h-auto w-24 shrink-0 object-cover"
                />
                <div className="min-w-0 px-2.5 py-1.5">
                  <p className="truncate text-xs font-bold leading-tight">{s.stadium}</p>
                  <p className="text-[10px] text-slate-400">{s.city}</p>
                  <ul className="mt-1 space-y-0.5">
                    {s.games.map((g, i) => (
                      <li key={i} className="flex items-center gap-1 text-[11px] text-slate-600">
                        <span className="text-slate-400">vs</span>
                        <Flag code={g.rivalFlag} className="h-2.5 w-4" />
                        <span className="truncate font-semibold">{g.rivalName}</span>
                        <span className="shrink-0 text-slate-400">· {g.date}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Camino + Convocatoria */}
      <div className="grid items-start gap-3.5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-black tracking-tight">Su camino en el Mundial</h2>
            <AddToCalendar
              mode="subscribe"
              icsPath={`/api/ics/equipo/${id}`}
              label="Seguir su calendario"
              align="right"
            />
          </div>
          <ul className="space-y-1.5">
            {matches.map((m) => (
              <TeamMatchRow key={m.id} m={m} teamId={id} />
            ))}
            {matches.length === 0 && (
              <li className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
                Sus cruces de eliminatorias aparecerán aquí cuando se definan.
              </li>
            )}
          </ul>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-baseline justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-2.5">
            <h2 className="text-sm font-black uppercase tracking-tight">Convocatoria oficial</h2>
            {detail?.coach && (
              <p className="truncate text-[11px] text-slate-500">
                DT: <span className="font-bold uppercase text-slate-700">{detail.coach}</span>
              </p>
            )}
          </div>
          {squad.length === 0 ? (
            <p className="px-4 py-4 text-xs text-slate-500">
              La lista oficial de convocados aparecerá aquí apenas se publique.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-3 sm:grid-cols-4">
              {POSITION_ORDER.filter((g) => byPosition.has(g)).map((g) => (
                <div key={g}>
                  <h3 className="mb-1 text-[10px] font-black uppercase tracking-[0.15em] text-amber-600">
                    {g}
                  </h3>
                  <ul className="space-y-0.5">
                    {byPosition.get(g)!.map((player) => {
                      const years = age(player.dateOfBirth);
                      return (
                        <li
                          key={player.id}
                          className="flex items-baseline justify-between gap-1.5"
                        >
                          <span className="truncate text-[11px] font-extrabold uppercase leading-snug tracking-tight text-slate-800">
                            {player.name}
                          </span>
                          {years !== null && (
                            <span className="shrink-0 text-[10px] tabular-nums text-slate-400">
                              {years}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
