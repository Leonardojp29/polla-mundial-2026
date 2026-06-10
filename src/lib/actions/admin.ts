'use server';

import { redirect } from 'next/navigation';
import { revalidatePath, updateTag } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

// Carga el resultado de un partido y recalcula los puntos de todas las
// predicciones (lo valida la BD: solo rol admin).
export async function saveResult(formData: FormData) {
  const matchId = Number(formData.get('match_id'));
  const home = Number(formData.get('home_score'));
  const away = Number(formData.get('away_score'));

  if (
    !Number.isInteger(matchId) ||
    !Number.isInteger(home) || !Number.isInteger(away) ||
    home < 0 || away < 0 || home > 99 || away > 99
  ) {
    redirect('/admin?error=' + encodeURIComponent('Marcador inválido.'));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc('set_match_result', {
    p_match_id: matchId,
    p_home: home,
    p_away: away,
  });
  if (error) redirect('/admin?error=' + encodeURIComponent(error.message));

  // updateTag: expira la caché de inmediato (el admin ve su cambio al volver).
  updateTag('public-data');
  revalidatePath('/admin');
  redirect('/admin?ok=' + matchId);
}

// Asigna los equipos de un cruce de eliminatorias (cuando se define la llave).
export async function setMatchTeams(formData: FormData) {
  const matchId = Number(formData.get('match_id'));
  const home = String(formData.get('home_team') ?? '');
  const away = String(formData.get('away_team') ?? '');
  if (!Number.isInteger(matchId) || !home || !away) {
    redirect('/admin?error=' + encodeURIComponent('Elige ambos equipos.'));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc('set_match_teams', {
    p_match_id: matchId,
    p_home: home,
    p_away: away,
  });
  if (error) redirect('/admin?error=' + encodeURIComponent(error.message));

  updateTag('public-data');
  revalidatePath('/admin');
  redirect('/admin?teams=' + matchId);
}

// Recalcula los puntos de los pronósticos maestros (y guarda el goleador real).
export async function recalcSpecials(formData: FormData) {
  const topScorer = String(formData.get('top_scorer') ?? '').trim();

  const supabase = await createClient();
  const { error } = await supabase.rpc('recalc_special_points', {
    p_top_scorer: topScorer === '' ? null : topScorer,
  });
  if (error) redirect('/admin?error=' + encodeURIComponent(error.message));

  revalidatePath('/admin');
  redirect('/admin?specials=1');
}

// Reabre un partido (borra resultado y puntos otorgados).
export async function clearResult(formData: FormData) {
  const matchId = Number(formData.get('match_id'));
  if (!Number.isInteger(matchId)) redirect('/admin');

  const supabase = await createClient();
  const { error } = await supabase.rpc('clear_match_result', { p_match_id: matchId });
  if (error) redirect('/admin?error=' + encodeURIComponent(error.message));

  updateTag('public-data');
  revalidatePath('/admin');
  redirect('/admin?reopened=' + matchId);
}
