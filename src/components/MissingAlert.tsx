'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IconAlert, IconX } from '@/components/Icons';

export type MissingPool = {
  poolId: string;
  poolName: string;
  count: number;
  closeLabel: string | null;
};

// Clave por polla y por día (Lima): al cerrar, el aviso no vuelve hasta mañana.
const todayKey = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
const storageKey = (poolId: string) => `missing-dismissed-${poolId}`;

// Aviso de pronósticos pendientes (Home: varias pollas · Polla: una sola),
// cerrable con la X — se oculta por el resto del día en este navegador.
export function MissingAlert({ pools }: { pools: MissingPool[] }) {
  const [dismissed, setDismissed] = useState<Set<string> | null>(null);

  useEffect(() => {
    const today = todayKey();
    const set = new Set<string>();
    for (const p of pools) {
      try {
        if (localStorage.getItem(storageKey(p.poolId)) === today) set.add(p.poolId);
      } catch {
        /* sin localStorage */
      }
    }
    setDismissed(set);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ids estables por render del server
  }, []);

  function dismiss(poolId: string) {
    try {
      localStorage.setItem(storageKey(poolId), todayKey());
    } catch {
      /* sin localStorage */
    }
    setDismissed((prev) => new Set([...(prev ?? []), poolId]));
  }

  // Hasta leer localStorage no se pinta nada (evita el parpadeo de aparecer y
  // desaparecer para quien ya lo cerró hoy).
  if (dismissed === null) return null;

  const visible = pools.filter((p) => p.count > 0 && !dismissed.has(p.poolId));
  if (visible.length === 0) return null;

  return (
    <div className="mb-6 space-y-2">
      {visible.slice(0, 3).map((p) => (
        <div
          key={p.poolId}
          className="relative rounded-2xl border border-amber-200 bg-amber-50 shadow-sm transition hover:border-amber-300"
        >
          <Link
            href={`/pollas/${p.poolId}/predicciones`}
            className="flex items-center justify-between gap-3 py-3 pl-4 pr-12 text-sm"
          >
            <span className="min-w-0 text-amber-900">
              <IconAlert className="mr-1 h-4 w-4 text-amber-600" />
              <strong>
                Te falta{p.count === 1 ? '' : 'n'} {p.count} pronóstico{p.count === 1 ? '' : 's'}
              </strong>{' '}
              en {p.poolName}
              {p.closeLabel && <span className="text-amber-700"> · el próximo {p.closeLabel}</span>}
            </span>
            <span className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 font-semibold text-white">
              Completar →
            </span>
          </Link>
          <button
            type="button"
            onClick={() => dismiss(p.poolId)}
            aria-label="Ocultar este aviso por hoy"
            title="Ocultar por hoy"
            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full text-amber-500 transition hover:bg-amber-200 hover:text-amber-800"
          >
            <IconX className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
