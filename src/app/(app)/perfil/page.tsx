import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/data';
import { ProfileForms } from '@/components/ProfileForms';

export default async function PerfilPage() {
  const user = await getUser();
  if (!user) redirect('/login');

  const supabase = await createClient();
  const [{ data: profile }, { count: poolCount }] = await Promise.all([
    supabase
      .from('profiles')
      .select('first_name, last_name, username, email, country, phone, date_of_birth, role, created_at')
      .eq('id', user.id)
      .single(),
    supabase.from('memberships').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
  ]);

  if (!profile) redirect('/login');

  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('es-PE', {
        timeZone: 'America/Lima',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '';

  // Cuentas de Google no tienen contraseña local hasta que definan una.
  const hasGoogle = user.app_metadata?.providers?.includes('google') ?? false;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Link href="/" className="text-sm text-slate-500 hover:underline">
        ← Volver
      </Link>

      <header className="mb-6 mt-4 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl font-black text-emerald-700">
          {(profile.first_name?.[0] ?? '?').toUpperCase()}
          {(profile.last_name?.[0] ?? '').toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">
            {profile.first_name} {profile.last_name}
            {profile.role === 'admin' && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 align-middle text-xs font-semibold text-amber-800">
                Admin
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500">
            {profile.email} · miembro desde {memberSince} · {poolCount ?? 0} polla
            {(poolCount ?? 0) === 1 ? '' : 's'}
          </p>
        </div>
      </header>

      <ProfileForms
        profile={{
          first_name: profile.first_name ?? '',
          last_name: profile.last_name ?? '',
          username: profile.username ?? '',
          country: profile.country ?? '',
          phone: profile.phone ?? '',
          date_of_birth: profile.date_of_birth ?? '',
        }}
        hasGoogle={hasGoogle}
      />
    </div>
  );
}
