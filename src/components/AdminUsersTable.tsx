'use client';

import { useState } from 'react';
import { Avatar } from '@/components/Avatar';
import { Pagination } from '@/components/Pagination';
import { IconLock, IconSearch } from '@/components/Icons';
import { GlobalBadge } from '@/components/WcBadges';

export type AdminUser = {
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

const PER_PAGE = 20;

const norm = (s: string | null | undefined) =>
  (s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const selectCls =
  'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200';

export function AdminUsersTable({ users }: { users: AdminUser[] }) {
  const [q, setQ] = useState('');
  const [pool, setPool] = useState('all');
  const [role, setRole] = useState('all');
  const [estado, setEstado] = useState('all');
  const [page, setPage] = useState(1);

  // Pollas existentes (para el filtro), las privadas primero.
  const poolNames = [...new Set(users.flatMap((u) => u.pools.map((p) => p.name)))].sort();

  const nq = norm(q);
  const filtered = users.filter((u) => {
    if (
      nq !== '' &&
      !norm(`${u.first_name} ${u.last_name}`).includes(nq) &&
      !norm(u.username).includes(nq) &&
      !norm(u.email).includes(nq)
    ) {
      return false;
    }
    if (pool !== 'all' && !u.pools.some((p) => p.name === pool)) return false;
    if (role === 'admin' && u.role !== 'admin') return false;
    if (role === 'creators' && !u.pools.some((p) => p.owner)) return false;
    if (estado === 'aldia' && u.global_missing > 0) return false;
    if (estado === 'pendientes' && u.global_missing === 0) return false;
    return true;
  });

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, pages);
  const visible = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  // Cualquier cambio de filtro vuelve a la página 1.
  const withReset = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  return (
    <div className="space-y-3">
      {/* Buscador + filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative w-full sm:w-72">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
          <input
            value={q}
            onChange={(e) => withReset(setQ)(e.target.value)}
            placeholder="Busca por nombre, usuario o correo…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          />
        </label>
        <select value={pool} onChange={(e) => withReset(setPool)(e.target.value)} className={selectCls}>
          <option value="all">Todas las pollas</option>
          {poolNames.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <select value={role} onChange={(e) => withReset(setRole)(e.target.value)} className={selectCls}>
          <option value="all">Todos los roles</option>
          <option value="admin">Solo admins</option>
          <option value="creators">Creadores de polla</option>
        </select>
        <select
          value={estado}
          onChange={(e) => withReset(setEstado)(e.target.value)}
          className={selectCls}
        >
          <option value="all">Cualquier estado</option>
          <option value="aldia">Al día (Global)</option>
          <option value="pendientes">Con pendientes (Global)</option>
        </select>
        <span className="ml-auto text-xs text-slate-400">
          {filtered.length} de {users.length} cuenta{users.length === 1 ? '' : 's'}
        </span>
      </div>

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
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                  Ninguna cuenta coincide con los filtros.
                </td>
              </tr>
            )}
            {visible.map((u) => {
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

      <Pagination page={safePage} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />
    </div>
  );
}
