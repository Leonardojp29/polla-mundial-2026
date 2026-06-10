import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getPool, getUser } from '@/lib/data';
import { getAllMatches } from '@/lib/publicData';
import { ShareCode } from '@/components/ShareCode';
import { PoolTabs } from '@/components/PoolTabs';
import { Avatar } from '@/components/Avatar';
import { MissingAlert } from '@/components/MissingAlert';
import { openMatches, missingFor, closeLabel } from '@/lib/missing';
import {
  IconCheck,
  IconClock,
  IconLock,
  IconTarget,
  IconTrendingUp,
  IconUsers,
  RankBadge,
} from '@/components/Icons';
import { GlobalBadge, TrophyBadge } from '@/components/WcBadges';

type LeaderboardRow = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  points: number;
  predictions_count: number;
};

export default async function PoolLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const pool = await getPool(id);
  if (!pool) notFound();

  const supabase = await createClient();
  const user = await getUser();
  const [{ data: leaderboard }, { data: myPredictions }, allMatches] = await Promise.all([
    supabase.rpc('get_leaderboard', { p_pool_id: id }),
    supabase
      .from('predictions')
      .select('match_id')
      .eq('pool_id', id)
      .eq('user_id', user!.id),
    getAllMatches(),
  ]);
  const rows: LeaderboardRow[] = leaderboard ?? [];

  const missing = missingFor(
    openMatches(allMatches),
    new Set((myPredictions ?? []).map((p) => p.match_id)),
  );
  const members = rows.length;
  const myIndex = rows.findIndex((r) => r.user_id === user?.id);
  const top = rows.slice(0, 5);

  const deadline = pool.join_deadline
    ? new Date(pool.join_deadline).toLocaleString('es-PE', {
        timeZone: 'America/Lima',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <>
      <Link href="/" className="text-sm text-slate-500 hover:underline">
        ← Mis pollas
      </Link>

      <header className="mb-6 mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-3xl font-black tracking-tight">
            {pool.type === 'global' ? (
              <GlobalBadge className="h-10 w-10" />
            ) : (
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <IconLock className="h-5 w-5" />
              </span>
            )}
            {pool.name}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <IconUsers className="h-3.5 w-3.5" /> {members} jugador{members === 1 ? '' : 'es'}
            </span>
            {deadline && (
              <span className="flex items-center gap-1">
                <IconClock className="h-3.5 w-3.5" /> pronóstico maestro cierra: {deadline}
              </span>
            )}
          </p>
        </div>
        <PoolTabs poolId={pool.id} />
      </header>

      <MissingAlert
        pools={[
          {
            poolId: pool.id,
            poolName: pool.name,
            count: missing.count,
            closeLabel: closeLabel(missing.nextCloseIso),
          },
        ]}
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">{children}</div>

        <aside className="space-y-4 lg:sticky lg:top-20">
          {pool.type === 'private' && pool.code && <ShareCode code={pool.code} />}

          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
            <h3 className="mb-2 font-semibold">Cómo se juega</h3>
            <ul className="space-y-1.5 text-slate-500">
              <li className="flex items-center gap-2">
                <IconTarget className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>Marcador exacto: <strong className="text-slate-700">5 pts</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <IconCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>Acertar el resultado: <strong className="text-slate-700">3 pts</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <IconTrendingUp className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>En eliminatorias los puntos suben por ronda.</span>
              </li>
              <li className="flex items-center gap-2">
                <IconLock className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>Cada partido se cierra a su hora de inicio.</span>
              </li>
            </ul>
          </div>

          {/* Mini-ranking siempre visible */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 font-semibold">
                <TrophyBadge className="h-5 w-5" /> Ranking
              </h3>
              <Link
                href={`/pollas/${pool.id}/ranking`}
                className="text-xs font-semibold text-emerald-700 hover:underline"
              >
                Ver completo →
              </Link>
            </div>
            <ul className="space-y-1">
              {top.map((row, i) => (
                <li
                  key={row.user_id}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1 ${
                    row.user_id === user?.id ? 'bg-emerald-50 font-semibold' : ''
                  }`}
                >
                  <RankBadge rank={i + 1} className="h-5 w-5 text-[10px]" />
                  <Avatar name={row.display_name} url={row.avatar_url} className="h-6 w-6 text-[9px]" />
                  <span className="min-w-0 flex-1 truncate">{row.display_name}</span>
                  <span className="shrink-0 font-bold tabular-nums">{row.points}</span>
                </li>
              ))}
              {myIndex >= 5 && (
                <>
                  <li className="px-2 text-center text-xs text-slate-300">⋯</li>
                  <li className="flex items-center gap-2 rounded-lg bg-emerald-50 px-2 py-1 font-semibold">
                    <RankBadge rank={myIndex + 1} className="h-5 w-5 text-[10px]" />
                    <Avatar
                      name={rows[myIndex].display_name}
                      url={rows[myIndex].avatar_url}
                      className="h-6 w-6 text-[9px]"
                    />
                    <span className="min-w-0 flex-1 truncate">
                      {rows[myIndex].display_name}{' '}
                      <span className="text-xs text-emerald-600">(tú)</span>
                    </span>
                    <span className="shrink-0 font-bold tabular-nums">{rows[myIndex].points}</span>
                  </li>
                </>
              )}
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}
