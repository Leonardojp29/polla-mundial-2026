'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { INVITE_COOKIE } from '@/lib/invite';

// Botón "Unirme a la polla" de /invitacion/[code]:
//  - con sesión: une de inmediato y va a las predicciones de esa polla;
//  - sin sesión: guarda el código en cookie y manda al registro (el alta,
//    el login o Google completan la unión automáticamente).
export async function acceptInvite(code: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: poolId, error } = await supabase.rpc('join_pool_by_code', { p_code: code });
    if (error || !poolId) redirect(`/invitacion/${encodeURIComponent(code)}?error=1`);
    redirect(`/pollas/${poolId}/predicciones`);
  }

  const store = await cookies();
  store.set(INVITE_COOKIE, code, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60, // 1 hora para terminar el registro
  });
  redirect('/registro');
}
