import { createClient } from '@/lib/supabase/server';
import { getPool } from '@/lib/data';
import { getTeams } from '@/lib/publicData';
import { MaestroForm, type SpecialVM } from '@/components/MaestroForm';
import { ShareMaestroButton } from '@/components/ShareMaestroButton';

export default async function MaestroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [pool, teams, { data: special }] = await Promise.all([
    getPool(id),
    getTeams(),
    supabase
      .from('special_predictions')
      .select('champion_team_id, runner_up_team_id, semifinalist_team_ids, top_scorer_name, group_winners, points_awarded')
      .eq('pool_id', id)
      .maybeSingle(),
  ]);

  const locked = !!pool?.join_deadline && new Date(pool.join_deadline).getTime() <= Date.now();
  const deadlineLabel = pool?.join_deadline
    ? new Date(pool.join_deadline).toLocaleString('es-PE', {
        timeZone: 'America/Lima',
        day: '2-digit',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const current: SpecialVM = {
    champion: special?.champion_team_id ?? null,
    runnerUp: special?.runner_up_team_id ?? null,
    semis: special?.semifinalist_team_ids ?? [],
    topScorer: special?.top_scorer_name ?? null,
    groupWinners: (special?.group_winners as SpecialVM['groupWinners']) ?? {},
    points: special?.points_awarded ?? null,
  };

  return (
    <>
      <MaestroForm
        poolId={id}
        teams={teams}
        current={current}
        locked={locked}
        deadlineLabel={deadlineLabel}
      />
      {current.champion && <ShareMaestroButton poolId={id} />}
    </>
  );
}
