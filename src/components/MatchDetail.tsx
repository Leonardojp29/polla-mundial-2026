import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/data';
import { getAllMatches, getGlobalConsensus } from '@/lib/publicData';
import { getStadium } from '@/lib/stadiums';
import { matchDayParts } from '@/lib/dates';
import { GROUP_COLOR } from '@/lib/groupColors';
import { Flag } from '@/components/Flag';
import { Avatar } from '@/components/Avatar';
import { LiveDot } from '@/components/Icons';

const GLOBAL_POOL_ID = '00000000-0000-0000-0000-000000000001';

const STAGE_LABEL: Record<string, string> = {
  group: 'Fase de grupos',
  r32: 'Dieciseisavos',
  r16: 'Octavos de final',
  qf: 'Cuartos de final',
  sf: 'Semifinal',
  third: 'Tercer puesto',
  final: 'GRAN FINAL',
};

type PredRow = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  pred_home: number;
  pred_away: number;
  points: number | null;
};

// Ficha de un partido: estadio de fondo, marcador/hora, consenso de la Polla
// Global y, tras el kickoff, los pronósticos de todos. La usan la página
// /partidos/[id] y su modal interceptado.
export async function MatchDetail({ id }: { id: number }) {
  const allMatches = await getAllMatches();
  const m = allMatches.find((x) => x.id === id);
  if (!m) notFound();

  const supabase = await createClient();
  const user = await getUser();
  const started = !!m.kickoff_at && Date.parse(m.kickoff_at) <= Date.now();

  const [consensusRaw, { data: myPred }, predsRes] = await Promise.all([
    getGlobalConsensus(),
    supabase
      .from('predictions')
      .select('pred_home_score, pred_away_score, points_awarded')
      .eq('pool_id', GLOBAL_POOL_ID)
      .eq('match_id', id)
      .eq('user_id', user!.id)
      .maybeSingle(),
    started
      ? supabase.rpc('get_match_predictions', { p_pool_id: GLOBAL_POOL_ID, p_match_id: id })
      : Promise.resolve({ data: null }),
  ]);

  const consensus = consensusRaw.find((c) => c.match_id === id);
  const preds = (predsRes.data ?? null) as PredRow[] | null;

  const stadium = getStadium(m.venue);
  const { day, time } = matchDayParts(m.kickoff_at);
  const live = m.status === 'live';
  const finished = m.status === 'finished';
  const groupColor = m.group_letter ? GROUP_COLOR[m.group_letter] : 'bg-emerald-600';
  const pct = (n: number) => (consensus && consensus.total > 0 ? Math.round((n / consensus.total) * 100) : 0);

  const TeamSide = ({ side }: { side: 'home' | 'away' }) => {
    const team = side === 'home' ? m.home : m.away;
    const label = side === 'home' ? m.home_label : m.away_label;
    const teamId = side === 'home' ? m.home_team_id : m.away_team_id;
    const inner = (
      <span className="flex flex-col items-center gap-2">
        <Flag code={team?.flag_code} className="h-10 w-15 sm:h-12 sm:w-18" />
        <span className="max-w-[10rem] text-center text-base font-black leading-tight sm:text-lg">
          {team?.name ?? label ?? 'Por definir'}
        </span>
      </span>
    );
    return teamId ? (
      <Link href={`/equipos/${teamId}`} className="transition hover:opacity-80">
        {inner}
      </Link>
    ) : (
      inner
    );
  };

  return (
    <div className="space-y-3.5">
      {/* Hero con el estadio de fondo */}
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white">
        {stadium && (
          <>
            <Image
              src={stadium.img}
              alt={stadium.stadium}
              fill
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/60 to-emerald-950/85" />
          </>
        )}
        <div className="relative z-10 px-5 py-6 sm:px-8">
          <div className="flex flex-wrap items-center justify-center gap-2 text-center">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-white ${groupColor}`}
            >
              {STAGE_LABEL[m.stage]}
              {m.stage === 'group' && m.group_letter ? ` · Grupo ${m.group_letter}` : ''}
            </span>
            {live && (
              <span className="flex items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-red-300">
                <LiveDot /> En vivo
              </span>
            )}
          </div>

          <div className="mt-4 flex items-start justify-center gap-5 sm:gap-10">
            <TeamSide side="home" />
            <div className="pt-1 text-center">
              {live || finished ? (
                <>
                  <p className="text-4xl font-black tabular-nums sm:text-5xl">
                    {m.home_score ?? 0} – {m.away_score ?? 0}
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-emerald-200">
                    {finished ? 'Final del partido' : 'Marcador parcial'}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-4xl font-black tabular-nums sm:text-5xl">{time}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-emerald-200">
                    hora Perú · {day}
                  </p>
                </>
              )}
            </div>
            <TeamSide side="away" />
          </div>

          {stadium && (
            <p className="mt-4 text-center text-xs text-emerald-100/80">
              {stadium.stadium} · {stadium.city}
            </p>
          )}
        </div>
      </header>

      {/* Tu pronóstico */}
      <section className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
        <p className="text-sm">
          {myPred ? (
            <>
              Tu pronóstico (Polla Global):{' '}
              <strong className="tabular-nums">
                {myPred.pred_home_score} – {myPred.pred_away_score}
              </strong>
            </>
          ) : started ? (
            <span className="text-slate-500">No pronosticaste este partido.</span>
          ) : (
            <span className="text-amber-700">Aún no pronosticas este partido.</span>
          )}
        </p>
        {myPred?.points_awarded !== null && myPred?.points_awarded !== undefined ? (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-black ${
              myPred.points_awarded > 0
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            +{myPred.points_awarded} pts
          </span>
        ) : (
          !started && (
            <Link
              href={`/pollas/${GLOBAL_POOL_ID}/predicciones`}
              className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
            >
              {myPred ? 'Cambiar →' : 'Pronosticar →'}
            </Link>
          )
        )}
      </section>

      {/* Consenso de la polla */}
      {consensus && consensus.total > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-black tracking-tight">
            ¿Qué dice la Polla Global? ({consensus.total} pronóstico
            {consensus.total === 1 ? '' : 's'})
          </h2>
          <div className="flex h-7 overflow-hidden rounded-lg text-[10px] font-black text-white">
            {consensus.home_n > 0 && (
              <div
                className="flex items-center justify-center bg-emerald-600"
                style={{ width: `${pct(consensus.home_n)}%` }}
              >
                {pct(consensus.home_n)}%
              </div>
            )}
            {consensus.draw_n > 0 && (
              <div
                className="flex items-center justify-center bg-slate-400"
                style={{ width: `${pct(consensus.draw_n)}%` }}
              >
                {pct(consensus.draw_n)}%
              </div>
            )}
            {consensus.away_n > 0 && (
              <div
                className="flex items-center justify-center bg-sky-600"
                style={{ width: `${pct(consensus.away_n)}%` }}
              >
                {pct(consensus.away_n)}%
              </div>
            )}
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            <span className="font-semibold text-emerald-700">
              Gana {m.home?.name ?? 'local'}
            </span>{' '}
            · <span className="font-semibold text-slate-500">Empate</span> ·{' '}
            <span className="font-semibold text-sky-700">Gana {m.away?.name ?? 'visita'}</span>
            {consensus.top_score && (
              <>
                {' '}
                · marcador más elegido: <strong>{consensus.top_score}</strong>
              </>
            )}
          </p>
        </section>
      )}

      {/* Pronósticos de la polla (tras el kickoff) */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-2.5 text-sm font-black tracking-tight">
          Pronósticos de la Polla Global
        </h2>
        {!started ? (
          <p className="px-4 py-3 text-xs text-slate-500">
            Se revelan cuando arranque el partido — así nadie se copia.
          </p>
        ) : !preds || preds.length === 0 ? (
          <p className="px-4 py-3 text-xs text-slate-500">Nadie pronosticó este partido.</p>
        ) : (
          <ul className="divide-y divide-slate-50">
            {preds.map((p) => (
              <li key={p.user_id} className="flex items-center gap-2.5 px-4 py-2 text-sm">
                <Avatar name={p.display_name} url={p.avatar_url} className="h-7 w-7 text-[10px]" />
                <span className="min-w-0 flex-1 truncate">
                  {p.display_name}
                  {p.user_id === user?.id && (
                    <span className="ml-1 text-xs text-emerald-600">(tú)</span>
                  )}
                </span>
                <span className="font-black tabular-nums">
                  {p.pred_home}–{p.pred_away}
                </span>
                {p.points !== null && (
                  <span
                    className={`w-10 rounded-full px-1.5 py-0.5 text-center text-[10px] font-black ${
                      p.points > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    +{p.points}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
