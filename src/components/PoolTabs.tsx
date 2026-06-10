'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function PoolTabs({ poolId }: { poolId: string }) {
  const pathname = usePathname();
  const base = `/pollas/${poolId}`;

  const tabs = [
    { href: `${base}/predicciones`, label: 'Grupos' },
    { href: `${base}/eliminatorias`, label: 'Eliminatorias' },
    { href: `${base}/maestro`, label: 'Maestro' },
    { href: `${base}/estadisticas`, label: 'Stats' },
    { href: `${base}/ranking`, label: 'Ranking' },
  ];

  return (
    <nav className="flex flex-wrap gap-2 text-sm">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={
              active
                ? 'rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white'
                : 'rounded-lg border border-slate-200 bg-white px-4 py-2 font-medium text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700'
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
