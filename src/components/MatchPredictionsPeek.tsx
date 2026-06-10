'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Avatar } from '@/components/Avatar';
import { IconEye } from '@/components/Icons';

type Row = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  pred_home: number;
  pred_away: number;
  points: number | null;
};

// "¿Qué puso la polla?" — visible solo cuando el partido ya empezó
// (la RLS rechaza la consulta antes del kickoff).
export function MatchPredictionsPeek({ poolId, matchId }: { poolId: string; matchId: number }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[] | 'loading' | null>(null);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && rows === null) {
      setRows('loading');
      const supabase = createClient();
      const { data, error } = await supabase.rpc('get_match_predictions', {
        p_pool_id: poolId,
        p_match_id: matchId,
      });
      setRows(error ? [] : ((data as Row[]) ?? []));
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={toggle}
        className="w-full rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
      >
        {open ? (
          'Ocultar pronósticos'
        ) : (
          <>
            <IconEye className="mr-1 h-3.5 w-3.5" /> Ver pronósticos de la polla
          </>
        )}
      </button>
      {open && (
        <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
          {rows === 'loading' || rows === null ? (
            <p className="py-1 text-center text-xs text-slate-400">Cargando…</p>
          ) : rows.length === 0 ? (
            <p className="py-1 text-center text-xs text-slate-400">
              Nadie pronosticó este partido.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {rows.map((r) => (
                <li key={r.user_id} className="flex items-center gap-2 py-1.5 text-sm">
                  <Avatar name={r.display_name} url={r.avatar_url} className="h-6 w-6 text-[9px]" />
                  <span className="min-w-0 flex-1 truncate">{r.display_name}</span>
                  <span className="font-black tabular-nums">
                    {r.pred_home}–{r.pred_away}
                  </span>
                  {r.points !== null && (
                    <span
                      className={`w-9 rounded-full px-1.5 py-0.5 text-center text-[10px] font-black ${
                        r.points > 0
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      +{r.points}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
