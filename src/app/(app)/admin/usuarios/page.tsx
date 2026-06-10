import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/data';
import { IconUsers } from '@/components/Icons';
import { AdminUsersTable, type AdminUser } from '@/components/AdminUsersTable';

export default async function AdminUsuariosPage() {
  const profile = await getProfile();
  if (profile?.role !== 'admin') redirect('/');

  const supabase = await createClient();
  const { data } = await supabase.rpc('admin_list_users');
  const users: AdminUser[] = data ?? [];

  return (
    <>
      <Link href="/admin" className="text-sm text-slate-500 hover:underline">
        ← Panel admin
      </Link>
      <header className="mb-6 mt-3">
        <h1 className="flex items-center gap-2.5 text-3xl font-black tracking-tight">
          <IconUsers className="h-7 w-7 text-slate-500" /> Usuarios registrados
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Por privacidad, los marcadores pronosticados nunca se muestran — solo conteos.
        </p>
      </header>

      <AdminUsersTable users={users} />
    </>
  );
}
