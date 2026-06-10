import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/data';
import { RankingTable, type RankingRow } from '@/components/RankingTable';

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
  const rows: RankingRow[] = leaderboard ?? [];

  return (
    <>
      <RankingTable rows={rows} currentUserId={user?.id ?? null} poolId={id} />
      <p className="mt-3 text-center text-xs text-slate-400">
        Toca un jugador para ver sus pronósticos de los partidos ya iniciados.
      </p>
    </>
  );
}
