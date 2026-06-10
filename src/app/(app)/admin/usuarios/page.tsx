import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/data';
import { Avatar } from '@/components/Avatar';
import { IconLock, IconUsers } from '@/components/Icons';
import { GlobalBadge } from '@/components/WcBadges';

type AdminUser = {
  user_id: string;
  first_name: string;
  last_name: string;
  username: string | null;
  email: string | null;
  country: string | null;
  phone: string | null;
  date_of_birth: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin';
  created_at: string;
  pools: { name: string; type: 'global' | 'private'; owner: boolean }[];
  global_predicted: number;
  global_missing: number;
  total_predictions: number;
};

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

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
      <header className="mb-6 mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2.5 text-3xl font-black tracking-tight">
            <IconUsers className="h-7 w-7 text-slate-500" /> Usuarios registrados
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {users.length} cuenta{users.length === 1 ? '' : 's'} · Por privacidad, los marcadores
            pronosticados nunca se muestran — solo conteos.
          </p>
        </div>
      </header>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3 font-medium">Usuario</th>
              <th className="px-4 py-3 font-medium">Datos</th>
              <th className="px-4 py-3 font-medium">Pollas</th>
              <th className="px-4 py-3 text-right font-medium">Polla Global</th>
              <th className="px-4 py-3 text-right font-medium">Pronósticos</th>
              <th className="px-4 py-3 text-right font-medium">Registro</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const name = `${u.first_name} ${u.last_name}`.trim() || u.username || '—';
              return (
                <tr key={u.user_id} className="border-b border-slate-50 align-top last:border-0">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2.5">
                      <Avatar name={name} url={u.avatar_url} className="h-9 w-9 text-xs" />
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 font-bold">
                          {name}
                          {u.role === 'admin' && (
                            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-black uppercase text-amber-800">
                              Admin
                            </span>
                          )}
                        </span>
                        <span className="block text-xs text-slate-400">
                          @{u.username ?? '—'} · {u.email ?? '—'}
                        </span>
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    <span className="block">{u.country ?? 'Sin país'}</span>
                    <span className="block">{u.phone ?? 'Sin teléfono'}</span>
                    <span className="block">
                      {u.date_of_birth ? `Nac. ${fmtDate(u.date_of_birth)}` : 'Sin fecha de nac.'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex max-w-56 flex-wrap gap-1">
                      {u.pools.map((p) => (
                        <span
                          key={p.name}
                          title={p.owner ? 'Creador de esta polla' : undefined}
                          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            p.owner
                              ? 'bg-amber-50 text-amber-800 ring-1 ring-amber-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {p.type === 'global' ? (
                            <GlobalBadge className="h-3.5 w-3.5" />
                          ) : (
                            <IconLock className="h-3 w-3" />
                          )}
                          {p.name}
                          {p.owner && <span className="font-black">· creador</span>}
                        </span>
                      ))}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-black tabular-nums">{u.global_predicted}/104</span>
                    {u.global_missing > 0 ? (
                      <span className="block text-xs font-semibold text-amber-600">
                        le faltan {u.global_missing} abiertos
                      </span>
                    ) : (
                      <span className="block text-xs text-emerald-600">al día</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-500">
                    {u.total_predictions}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-slate-400">
                    {fmtDate(u.created_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
