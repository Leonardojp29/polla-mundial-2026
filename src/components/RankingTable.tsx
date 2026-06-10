'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Avatar } from '@/components/Avatar';
import { Flag } from '@/components/Flag';
import { LiveDot, RankBadge } from '@/components/Icons';

export type RankingRow = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  points: number;
  predictions_count: number;
};

type BreakdownRow = {
  match_id: number;
  stage: string;
  group_letter: string | null;
  kickoff_at: string;
  status: 'scheduled' | 'live' | 'finished';
  home_name: string;
  home_flag: string | null;
  away_name: string;
  away_flag: string | null;
  home_score: number | null;
  away_score: number | null;
  pred_home: number;
  pred_away: number;
  points: number | null;
};

function PointsChip({ points, live }: { points: number | null; live: boolean }) {
  if (live) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-black text-red-600">
        <LiveDot /> en juego
      </span>
    );
  }
  if (points === null) return <span className="text-xs text-slate-300">—</span>;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-black ${
        points > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
      }`}
    >
      +{points}
    </span>
  );
}

function Breakdown({ rows }: { rows: BreakdownRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="px-4 py-3 text-sm text-slate-500">
        Sus pronósticos se mostrarán aquí cuando los partidos vayan empezando.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-slate-100">
      {rows.map((r) => (
        <li key={r.match_id} className="flex items-center gap-3 px-4 py-2 text-sm">
          <span className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
            <span className="truncate text-right">{r.home_name}</span>
            <Flag code={r.home_flag} className="h-3.5 w-5" />
          </span>
          <span className="shrink-0 text-center">
            <span className="block font-black tabular-nums">
              {r.pred_home}–{r.pred_away}
            </span>
            {r.home_score !== null && (
              <span className="block text-[10px] text-slate-400">
                real {r.home_score}–{r.away_score}
              </span>
            )}
          </span>
          <span className="flex min-w-0 flex-1 items-center gap-1.5">
            <Flag code={r.away_flag} className="h-3.5 w-5" />
            <span className="truncate">{r.away_name}</span>
          </span>
          <span className="w-20 shrink-0 text-right">
            <PointsChip points={r.points} live={r.status === 'live'} />
          </span>
        </li>
      ))}
    </ul>
  );
}

// Ranking completo: clic en un jugador → desglose de sus pronósticos en
// partidos ya iniciados (antes del kickoff nadie puede copiarse).
export function RankingTable({
  rows,
  currentUserId,
  poolId,
}: {
  rows: RankingRow[];
  currentUserId: string | null;
  poolId: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [cache, setCache] = useState<Record<string, BreakdownRow[] | 'loading'>>({});

  async function toggle(userId: string) {
    if (openId === userId) {
      setOpenId(null);
      return;
    }
    setOpenId(userId);
    if (!cache[userId]) {
      setCache((c) => ({ ...c, [userId]: 'loading' }));
      const supabase = createClient();
      const { data } = await supabase.rpc('get_player_breakdown', {
        p_pool_id: poolId,
        p_user_id: userId,
      });
      setCache((c) => ({ ...c, [userId]: (data as BreakdownRow[]) ?? [] }));
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
            <th className="px-4 py-3 font-medium">#</th>
            <th className="px-4 py-3 font-medium">Jugador</th>
            <th className="px-4 py-3 text-right font-medium">Pronósticos</th>
            <th className="px-4 py-3 text-right font-medium">Puntos</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const open = openId === row.user_id;
            const detail = cache[row.user_id];
            return (
              <FragmentRow
                key={row.user_id}
                row={row}
                index={i}
                isMe={row.user_id === currentUserId}
                open={open}
                detail={detail}
                onToggle={() => toggle(row.user_id)}
              />
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function FragmentRow({
  row,
  index,
  isMe,
  open,
  detail,
  onToggle,
}: {
  row: RankingRow;
  index: number;
  isMe: boolean;
  open: boolean;
  detail: BreakdownRow[] | 'loading' | undefined;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        title="Ver pronósticos (partidos ya iniciados)"
        className={`cursor-pointer border-b border-slate-50 transition last:border-0 hover:bg-slate-50 ${
          isMe ? 'bg-emerald-50/60 font-semibold' : ''
        }`}
      >
        <td className="px-4 py-3">
          <RankBadge rank={index + 1} />
        </td>
        <td className="px-4 py-3">
          <span className="flex items-center gap-2.5">
            <Avatar name={row.display_name} url={row.avatar_url} className="h-8 w-8 text-xs" />
            <span className="min-w-0 truncate">
              {row.display_name}
              {isMe && <span className="ml-1 text-xs text-emerald-600">(tú)</span>}
            </span>
            <span className={`text-xs text-slate-300 transition ${open ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </span>
        </td>
        <td className="px-4 py-3 text-right tabular-nums text-slate-500">
          {row.predictions_count}/104
        </td>
        <td className="px-4 py-3 text-right text-base tabular-nums">{row.points}</td>
      </tr>
      {open && (
        <tr className="border-b border-slate-100 bg-slate-50/60">
          <td colSpan={4} className="p-0">
            {detail === 'loading' || detail === undefined ? (
              <p className="px-4 py-3 text-sm text-slate-400">Cargando pronósticos…</p>
            ) : (
              <Breakdown rows={detail} />
            )}
          </td>
        </tr>
      )}
    </>
  );
}
