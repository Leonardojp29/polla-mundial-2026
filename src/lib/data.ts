import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

// Lecturas comunes deduplicadas por request: si el layout y la página piden lo
// mismo, solo se ejecuta una consulta.

export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getProfile = cache(async () => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('id, first_name, username, role, avatar_url')
    .eq('id', user.id)
    .single();
  return data;
});

export const getPool = cache(async (poolId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from('pools')
    .select('id, name, type, code, join_deadline')
    .eq('id', poolId)
    .single();
  return data;
});
