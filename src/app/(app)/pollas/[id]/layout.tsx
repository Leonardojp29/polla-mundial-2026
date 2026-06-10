import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getPool, getUser } from '@/lib/data';
import { ShareCode } from '@/components/ShareCode';
import { PoolTabs } from '@/components/PoolTabs';

type LeaderboardRow = {
  user_id: string;
  display_name: string;
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
  const [user, { data: leaderboard }] = await Promise.all([
    getUser(),
    supabase.rpc('get_leaderboard', { p_pool_id: id }),
  ]);
  const rows: LeaderboardRow[] = leaderboard ?? [];
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

  const medal = (i: number) => (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`);

  return (
    <>
      <Link href="/" className="text-sm text-slate-500 hover:underline">
        ← Mis pollas
      </Link>

      <header className="mb-6 mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-black tracking-tight">
            <span>{pool.type === 'global' ? '🌍' : '🔒'}</span>
            {pool.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            👥 {members} jugador{members === 1 ? '' : 'es'}
            {deadline && <> · ⏳ pronóstico maestro cierra: {deadline}</>}
          </p>
        </div>
        <PoolTabs poolId={pool.id} />
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">{children}</div>

        <aside className="space-y-4 lg:sticky lg:top-20">
          {pool.type === 'private' && pool.code && <ShareCode code={pool.code} />}

          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
            <h3 className="mb-2 font-semibold">Cómo se juega</h3>
            <ul className="space-y-1.5 text-slate-500">
              <li>🎯 Marcador exacto: <strong className="text-slate-700">5 pts</strong></li>
              <li>✅ Acertar el resultado: <strong className="text-slate-700">3 pts</strong></li>
              <li>📈 En eliminatorias los puntos suben por ronda.</li>
              <li>🔒 Cada partido se cierra a su hora de inicio.</li>
            </ul>
          </div>

          {/* Mini-ranking siempre visible */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">🏆 Ranking</h3>
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
                  <span className="w-6 shrink-0 text-center text-xs">{medal(i)}</span>
                  <span className="min-w-0 flex-1 truncate">{row.display_name}</span>
                  <span className="shrink-0 font-bold tabular-nums">{row.points}</span>
                </li>
              ))}
              {myIndex >= 5 && (
                <>
                  <li className="px-2 text-center text-xs text-slate-300">⋯</li>
                  <li className="flex items-center gap-2 rounded-lg bg-emerald-50 px-2 py-1 font-semibold">
                    <span className="w-6 shrink-0 text-center text-xs">{myIndex + 1}</span>
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
