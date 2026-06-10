'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type SaveState = { ok?: string; error?: string };

// Guarda (upsert) los pronósticos enviados en el formulario de un grupo.
// Campos esperados: pool_id y pares h-<matchId> / a-<matchId>.
// El bloqueo por kickoff se valida aquí y además lo refuerza RLS en la BD.
export async function savePredictions(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Sesión expirada. Vuelve a iniciar sesión.' };

  const poolId = String(formData.get('pool_id') ?? '');
  if (!poolId) return { error: 'Falta la polla.' };

  // Recolectar marcadores por partido.
  const byMatch = new Map<number, { h?: number; a?: number }>();
  for (const [key, raw] of formData.entries()) {
    const m = key.match(/^([ha])-(\d+)$/);
    if (!m) continue;
    const value = String(raw).trim();
    if (value === '') continue;
    const score = Number(value);
    if (!Number.isInteger(score) || score < 0 || score > 99) {
      return { error: 'Los marcadores deben ser números enteros entre 0 y 99.' };
    }
    const id = Number(m[2]);
    const entry = byMatch.get(id) ?? {};
    if (m[1] === 'h') entry.h = score;
    else entry.a = score;
    byMatch.set(id, entry);
  }

  if (byMatch.size === 0) return { error: 'No hay marcadores para guardar.' };

  // Solo partidos que aún no comienzan.
  const ids = [...byMatch.keys()];
  const { data: matches } = await supabase
    .from('matches')
    .select('id, kickoff_at')
    .in('id', ids);
  const open = new Set(
    (matches ?? [])
      .filter((m) => m.kickoff_at && new Date(m.kickoff_at).getTime() > Date.now())
      .map((m) => m.id),
  );

  const rows: {
    pool_id: string;
    user_id: string;
    match_id: number;
    pred_home_score: number;
    pred_away_score: number;
  }[] = [];
  let incomplete = 0;
  let locked = 0;

  for (const [matchId, { h, a }] of byMatch) {
    if (h === undefined || a === undefined) {
      incomplete++;
      continue;
    }
    if (!open.has(matchId)) {
      locked++;
      continue;
    }
    rows.push({
      pool_id: poolId,
      user_id: user.id,
      match_id: matchId,
      pred_home_score: h,
      pred_away_score: a,
    });
  }

  if (rows.length > 0) {
    const { error } = await supabase
      .from('predictions')
      .upsert(rows, { onConflict: 'pool_id,user_id,match_id' });
    if (error) return { error: `No se pudo guardar: ${error.message}` };
    revalidatePath(`/pollas/${poolId}`, 'layout');
  }

  const parts: string[] = [];
  if (rows.length > 0) parts.push(`${rows.length} pronóstico${rows.length === 1 ? '' : 's'} guardado${rows.length === 1 ? '' : 's'}`);
  if (incomplete > 0) parts.push(`${incomplete} incompleto${incomplete === 1 ? '' : 's'} (faltó un marcador)`);
  if (locked > 0) parts.push(`${locked} ya cerrado${locked === 1 ? '' : 's'}`);
  if (rows.length === 0) return { error: parts.join(' · ') || 'Nada que guardar.' };
  return { ok: parts.join(' · ') };
}
