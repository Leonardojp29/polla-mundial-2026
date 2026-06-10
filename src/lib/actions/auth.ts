'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { consumePendingInvite } from '@/lib/invite';
import { ensureEnvAdmin } from '@/lib/adminBootstrap';

export type AuthState = { error?: string; ok?: string };

// Envía el correo de recuperación. Siempre responde lo mismo (no revela si el
// correo existe o no).
export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim();
  if (!email) return { error: 'Escribe tu correo.' };

  const h = await headers();
  const origin = h.get('origin') ?? `https://${h.get('host')}`;

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/restablecer`,
  });

  return {
    ok: 'Si ese correo está registrado, te llegará un enlace para restablecer tu contraseña. Revisa también spam.',
  };
}

// El enlace del correo deja al usuario con sesión temporal: aquí define la nueva.
export async function resetPassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');
  if (password.length < 6) return { error: 'La contraseña debe tener al menos 6 caracteres.' };
  if (password !== confirm) return { error: 'Las contraseñas no coinciden.' };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error && error.code !== 'same_password') {
    return { error: 'No se pudo cambiar la contraseña. Pide un enlace nuevo e intenta otra vez.' };
  }
  redirect('/');
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: 'Correo o contraseña incorrectos.' };

  await ensureEnvAdmin(data.user?.id, data.user?.email);
  const invitedPool = await consumePendingInvite(supabase);
  redirect(invitedPool ? `/pollas/${invitedPool}/predicciones` : '/');
}

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const first_name = String(formData.get('first_name') ?? '').trim();
  const last_name = String(formData.get('last_name') ?? '').trim();
  const username = String(formData.get('username') ?? '').trim();
  const country = String(formData.get('country') ?? '').trim();

  if (!email || !password || !first_name) {
    return { error: 'Nombre, correo y contraseña son obligatorios.' };
  }
  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres.' };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { first_name, last_name, username, country } },
  });
  if (error) return { error: error.message };

  await ensureEnvAdmin(data.user?.id, data.user?.email);
  const invitedPool = await consumePendingInvite(supabase);
  redirect(invitedPool ? `/pollas/${invitedPool}/predicciones` : '/');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
