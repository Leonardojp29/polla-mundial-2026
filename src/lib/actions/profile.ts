'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type ProfileState = { ok?: string; error?: string };

// Onboarding tras entrar con Google: completa usuario/país y define contraseña
// (así también puede iniciar sesión con correo + contraseña).
export async function completeProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Sesión expirada. Vuelve a iniciar sesión.' };

  const first_name = String(formData.get('first_name') ?? '').trim();
  const last_name = String(formData.get('last_name') ?? '').trim();
  const username = String(formData.get('username') ?? '').trim();
  const country = String(formData.get('country') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');

  if (!first_name || !username || !country) {
    return { error: 'Nombre, usuario y país son obligatorios.' };
  }
  if (password.length < 6) return { error: 'La contraseña debe tener al menos 6 caracteres.' };
  if (password !== confirm) return { error: 'Las contraseñas no coinciden.' };

  const { error: pwError } = await supabase.auth.updateUser({ password });
  if (pwError && pwError.code !== 'same_password') {
    return { error: `No se pudo definir la contraseña: ${pwError.message}` };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ first_name, last_name, username, country })
    .eq('id', user.id);

  if (error) {
    if (error.message.includes('username')) return { error: 'Ese nombre de usuario ya está en uso.' };
    return { error: `No se pudo guardar: ${error.message}` };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Sesión expirada. Vuelve a iniciar sesión.' };

  const first_name = String(formData.get('first_name') ?? '').trim();
  const last_name = String(formData.get('last_name') ?? '').trim();
  const username = String(formData.get('username') ?? '').trim() || null;
  const country = String(formData.get('country') ?? '').trim() || null;
  const phone = String(formData.get('phone') ?? '').trim() || null;
  const dobRaw = String(formData.get('date_of_birth') ?? '').trim();
  const date_of_birth = dobRaw === '' ? null : dobRaw;

  if (!first_name) return { error: 'El nombre es obligatorio.' };

  const { error } = await supabase
    .from('profiles')
    .update({ first_name, last_name, username, country, phone, date_of_birth })
    .eq('id', user.id);

  if (error) {
    if (error.message.includes('username')) return { error: 'Ese nombre de usuario ya está en uso.' };
    return { error: `No se pudo guardar: ${error.message}` };
  }

  revalidatePath('/perfil');
  revalidatePath('/', 'layout');
  return { ok: 'Perfil actualizado.' };
}

export async function changePassword(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Sesión expirada. Vuelve a iniciar sesión.' };

  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');

  if (password.length < 6) return { error: 'La contraseña debe tener al menos 6 caracteres.' };
  if (password !== confirm) return { error: 'Las contraseñas no coinciden.' };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === 'same_password') return { error: 'La nueva contraseña debe ser distinta a la actual.' };
    return { error: `No se pudo cambiar: ${error.message}` };
  }
  return { ok: 'Contraseña actualizada.' };
}
