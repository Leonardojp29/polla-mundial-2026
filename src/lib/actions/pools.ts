'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type PoolState = { error?: string };

// Crea una polla privada (RPC genera código e inscribe al creador como admin).
export async function createPool(_prev: PoolState, formData: FormData): Promise<PoolState> {
  const supabase = await createClient();
  const name = String(formData.get('name') ?? '').trim();
  if (!name) return { error: 'Ponle un nombre a la polla.' };

  const { data, error } = await supabase.rpc('create_pool', { p_name: name });
  if (error) return { error: error.message };

  const poolId = Array.isArray(data) ? data[0]?.id : data?.id;
  redirect(`/pollas/${poolId}`);
}

// Une al usuario a una polla privada con el código.
export async function joinPool(_prev: PoolState, formData: FormData): Promise<PoolState> {
  const supabase = await createClient();
  const code = String(formData.get('code') ?? '').trim();
  if (!code) return { error: 'Escribe el código.' };

  const { data: poolId, error } = await supabase.rpc('join_pool_by_code', { p_code: code });
  if (error) return { error: 'Código inválido. Revísalo e intenta de nuevo.' };

  redirect(`/pollas/${poolId}`);
}
