// Admin por variable de entorno: los correos de ADMIN_EMAILS (separados por
// coma) se promueven a admin automáticamente al iniciar sesión. Útil para no
// depender del script make-admin en cada base nueva (local o cloud).
import { createClient } from '@supabase/supabase-js';

export async function ensureEnvAdmin(
  userId: string | undefined,
  email: string | null | undefined,
): Promise<void> {
  if (!userId || !email || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  const admins = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (!admins.includes(email.toLowerCase())) return;

  const svc = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );
  await svc.from('profiles').update({ role: 'admin' }).eq('id', userId).neq('role', 'admin');
}
