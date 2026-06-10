import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/data';

type LeaderboardRow = {
  user_id: string;
  display_name: string;
  points: number;
  predictions_count: number;
};

export default async function RankingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [user, { data: leaderboard }] = await Promise.all([
    getUser(),
    supabase.rpc('get_leaderboard', { p_pool_id: id }),
  ]);
  const rows: LeaderboardRow[] = leaderboard ?? [];

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
            <th className="px-4 py-3 font-medium">#</th>
            <th className="px-4 py-3 font-medium">Jugador</th>
            <th className="px-4 py-3 text-right font-medium">Pronósticos</th>
            <th className="px-4 py-3 text-right font-medium">Puntos</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.user_id}
              className={`border-b border-slate-50 last:border-0 ${
                row.user_id === user?.id ? 'bg-emerald-50/60 font-semibold' : ''
              }`}
            >
              <td className="px-4 py-3 text-slate-400">
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
              </td>
              <td className="px-4 py-3">
                {row.display_name}
                {row.user_id === user?.id && (
                  <span className="ml-1 text-xs text-emerald-600">(tú)</span>
                )}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-500">
                {row.predictions_count}/104
              </td>
              <td className="px-4 py-3 text-right text-base tabular-nums">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
