import { Flag } from '@/components/Flag';
import { BallBadge } from '@/components/WcBadges';
import { RankBadge } from '@/components/Icons';
import type { TopScorer } from '@/lib/publicData';

// Tabla de goleadores reales del torneo (la actualiza el sync cada 10 min).
export function TopScorers({ scorers, limit = 8 }: { scorers: TopScorer[]; limit?: number }) {
  if (scorers.length === 0) return null;
  const top = scorers.slice(0, limit);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-3">
        <BallBadge className="h-7 w-7" />
        <h3 className="text-base font-black tracking-tight">Goleadores del Mundial</h3>
        <span className="ml-auto text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Se actualiza solo
        </span>
      </div>
      <ul className="grid sm:grid-cols-2">
        {top.map((s, i) => (
          <li
            key={s.player_id}
            className="flex items-center gap-2.5 border-b border-slate-50 px-5 py-2.5 sm:odd:border-r"
          >
            <RankBadge rank={i + 1} className="h-6 w-6 text-[10px]" />
            <Flag code={s.flag_code} className="h-3.5 w-5" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold leading-tight">
                {s.player_name}
              </span>
              {s.team_name && (
                <span className="block text-[11px] leading-tight text-slate-400">
                  {s.team_name}
                </span>
              )}
            </span>
            <span className="shrink-0 text-right">
              <span className="text-lg font-black tabular-nums">{s.goals}</span>
              <span className="ml-1 text-[10px] uppercase text-slate-400">
                gol{s.goals === 1 ? '' : 'es'}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
