// Invitación pendiente: cuando alguien sin sesión acepta un link/QR de polla,
// el código se guarda en una cookie y, apenas se autentica (registro, login o
// Google), se le une automáticamente y se le lleva a esa polla.
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

export const INVITE_COOKIE = 'pending_invite';

// Para Server Actions (login/registro): une y limpia la cookie.
// Devuelve el id de la polla, o null si no había invitación pendiente.
export async function consumePendingInvite(supabase: SupabaseClient): Promise<string | null> {
  const store = await cookies();
  const code = store.get(INVITE_COOKIE)?.value;
  if (!code) return null;
  store.delete(INVITE_COOKIE);
  const { data, error } = await supabase.rpc('join_pool_by_code', { p_code: code });
  return error ? null : ((data as string) ?? null);
}
