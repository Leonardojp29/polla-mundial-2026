import Link from 'next/link';
import { IconAlert } from '@/components/Icons';

export type MissingPool = {
  poolId: string;
  poolName: string;
  count: number;
  closeLabel: string | null;
};

// Aviso de pronósticos pendientes (Home: varias pollas · Polla: una sola).
export function MissingAlert({ pools }: { pools: MissingPool[] }) {
  const visible = pools.filter((p) => p.count > 0);
  if (visible.length === 0) return null;

  return (
    <div className="mb-6 space-y-2">
      {visible.slice(0, 3).map((p) => (
        <Link
          key={p.poolId}
          href={`/pollas/${p.poolId}/predicciones`}
          className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm shadow-sm transition hover:border-amber-300 hover:bg-amber-100"
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
      ))}
    </div>
  );
}
