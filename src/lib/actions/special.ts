'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type SpecialState = { ok?: string; error?: string };

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

// Guarda el pronóstico maestro. El cierre (join_deadline) lo refuerza RLS en la BD.
export async function saveSpecial(_prev: SpecialState, formData: FormData): Promise<SpecialState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Sesión expirada. Vuelve a iniciar sesión.' };

  const poolId = String(formData.get('pool_id') ?? '');
  if (!poolId) return { error: 'Falta la polla.' };

  const val = (k: string) => {
    const v = String(formData.get(k) ?? '').trim();
    return v === '' ? null : v;
  };

  // 1.º y 2.º por grupo → jsonb {"A": {"first": id, "second": id}, ...}
  const groupWinners: Record<string, { first: string; second: string }> = {};
  for (const g of GROUPS) {
    const first = val(`gw-${g}-1`);
    const second = val(`gw-${g}-2`);
    if (!first && !second) continue;
    if (!first || !second) return { error: `Grupo ${g}: elige 1.º y 2.º (o deja ambos vacíos).` };
    if (first === second) return { error: `Grupo ${g}: el 1.º y el 2.º no pueden ser el mismo equipo.` };
    groupWinners[g] = { first, second };
  }

  const semis = [val('semi-1'), val('semi-2'), val('semi-3'), val('semi-4')].filter(
    (s): s is string => s !== null,
  );
  if (new Set(semis).size !== semis.length) {
    return { error: 'Los semifinalistas deben ser equipos distintos.' };
  }

  const champion = val('champion');
  const runnerUp = val('runner_up');
  if (champion && runnerUp && champion === runnerUp) {
    return { error: 'El campeón y el finalista no pueden ser el mismo equipo.' };
  }

  const { error } = await supabase.from('special_predictions').upsert(
    {
      pool_id: poolId,
      user_id: user.id,
      champion_team_id: champion,
      runner_up_team_id: runnerUp,
      semifinalist_team_ids: semis.length ? semis : null,
      top_scorer_name: val('top_scorer'),
      group_winners: Object.keys(groupWinners).length ? groupWinners : null,
    },
    { onConflict: 'pool_id,user_id' },
  );
  if (error) {
    if (error.message.includes('row-level security')) {
      return { error: 'El pronóstico maestro ya cerró (comenzó el torneo).' };
    }
    return { error: `No se pudo guardar: ${error.message}` };
  }

  revalidatePath(`/pollas/${poolId}/maestro`);
  return { ok: 'Pronóstico maestro guardado.' };
}
