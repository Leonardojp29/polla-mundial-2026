'use client';

import { useEffect, useMemo, useState } from 'react';
import { Flag } from '@/components/Flag';
import { IconX } from '@/components/Icons';
import { TrophyBadge } from '@/components/WcBadges';
import { DragScroller } from '@/components/DragScroller';
import { GROUP_COLOR } from '@/lib/groupColors';

// ============ Tipos (los llena el servidor desde la caché pública) ============
export type TeamLite = { id: string; name: string; flag: string | null; group: string | null };
export type MatchLite = {
  id: number;
  stage: 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'third' | 'final';
  group: string | null;
  kickoff: string | null;
  venue: string | null;
  status: string;
  hs: number | null;
  as: number | null;
  home: TeamLite | null;
  away: TeamLite | null;
  homeLabel: string | null;
  awayLabel: string | null;
};

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

const STAGE_LABEL: Record<string, string> = {
  r32: 'Dieciseisavos', r16: 'Octavos', qf: 'Cuartos', sf: 'Semifinales',
  third: '3.er puesto', final: 'FINAL',
};

function fmtDate(iso: string | null, withTime = false) {
  if (!iso) return 'por definir';
  return new Date(iso).toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit',
    month: 'short',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

// ============ Tabla de posiciones de un grupo ============
type Row = {
  team: TeamLite; pj: number; g: number; e: number; p: number;
  gf: number; gc: number; dg: number; pts: number;
};

function computeStandings(teams: TeamLite[], matches: MatchLite[]): Row[] {
  const rows = new Map<string, Row>(
    teams.map((t) => [t.id, { team: t, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, dg: 0, pts: 0 }]),
  );
  for (const m of matches) {
    if (m.status !== 'finished' || !m.home || !m.away || m.hs === null || m.as === null) continue;
    const h = rows.get(m.home.id);
    const a = rows.get(m.away.id);
    if (!h || !a) continue;
    h.pj++; a.pj++;
    h.gf += m.hs; h.gc += m.as;
    a.gf += m.as; a.gc += m.hs;
    if (m.hs > m.as) { h.g++; a.p++; h.pts += 3; }
    else if (m.hs < m.as) { a.g++; h.p++; a.pts += 3; }
    else { h.e++; a.e++; h.pts++; a.pts++; }
  }
  return [...rows.values()]
    .map((r) => ({ ...r, dg: r.gf - r.gc }))
    .sort((x, y) => y.pts - x.pts || y.dg - x.dg || y.gf - x.gf || x.team.name.localeCompare(y.team.name));
}

// ============ Piezas de UI ============
function Score({ m }: { m: MatchLite }) {
  if (m.status === 'finished' && m.hs !== null) {
    return <span className="font-black tabular-nums">{m.hs} – {m.as}</span>;
  }
  return <span className="text-xs text-slate-400">{fmtDate(m.kickoff)}</span>;
}

function TeamName({
  team,
  label,
  onSelect,
  align = 'left',
}: {
  team: TeamLite | null;
  label: string | null;
  onSelect: (t: TeamLite) => void;
  align?: 'left' | 'right';
}) {
  if (!team) {
    return (
      <span className={`truncate text-xs italic text-slate-400 ${align === 'right' ? 'text-right' : ''}`}>
        {label ?? '?'}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={() => onSelect(team)}
      className={`flex min-w-0 items-center gap-1.5 truncate text-sm font-semibold hover:text-emerald-700 hover:underline ${
        align === 'right' ? 'flex-row-reverse text-right' : ''
      }`}
      title={`Ver los partidos de ${team.name}`}
    >
      <Flag code={team.flag} className="h-4 w-6 shrink-0" />
      <span className="truncate">{team.name}</span>
    </button>
  );
}

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function CloseBtn({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Cerrar"
      className="rounded-full px-2.5 py-1 text-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
    >
      <IconX className="h-4 w-4" />
    </button>
  );
}

// ============ Componente principal ============
export function TournamentExplorer({ teams, matches }: { teams: TeamLite[]; matches: MatchLite[] }) {
  const [view, setView] = useState<'groups' | 'bracket'>('groups');
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [openTeam, setOpenTeam] = useState<TeamLite | null>(null);

  const byGroup = useMemo(() => {
    const map = new Map<string, { teams: TeamLite[]; matches: MatchLite[] }>();
    for (const g of GROUPS) map.set(g, { teams: [], matches: [] });
    for (const t of teams) if (t.group) map.get(t.group)?.teams.push(t);
    for (const m of matches) if (m.stage === 'group' && m.group) map.get(m.group)?.matches.push(m);
    return map;
  }, [teams, matches]);

  const knockout = useMemo(
    () => matches.filter((m) => m.stage !== 'group'),
    [matches],
  );

  const finalMatch = knockout.find((m) => m.stage === 'final');
  const champion =
    finalMatch?.status === 'finished' && finalMatch.hs !== null && finalMatch.hs !== finalMatch.as
      ? (finalMatch.hs > finalMatch.as! ? finalMatch.home : finalMatch.away)
      : null;

  const teamMatches = openTeam
    ? matches
        .filter((m) => m.home?.id === openTeam.id || m.away?.id === openTeam.id)
        .sort((a, b) => (a.kickoff ?? '').localeCompare(b.kickoff ?? ''))
    : [];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      {/* Toggle */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl bg-slate-100 p-1">
          {(['groups', 'bracket'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                view === v ? 'bg-white text-emerald-700 shadow' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {v === 'groups' ? 'Fase de grupos' : 'Eliminatorias'}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400">
          Toca un grupo o una bandera para ver el detalle
        </p>
      </div>

      {/* ===== Vista de grupos ===== */}
      {view === 'groups' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {GROUPS.map((g) => {
            const data = byGroup.get(g)!;
            const rows = computeStandings(data.teams, data.matches);
            const started = data.matches.some((m) => m.status === 'finished');
            return (
              <button
                key={g}
                type="button"
                onClick={() => setOpenGroup(g)}
                className="overflow-hidden rounded-2xl border border-slate-200 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className={`${GROUP_COLOR[g]} px-3 py-1.5 text-sm font-black uppercase tracking-wider text-white`}>
                  Grupo {g}
                </div>
                <ul className="divide-y divide-slate-50 bg-white">
                  {rows.map((r, i) => (
                    <li key={r.team.id} className="flex items-center gap-2 px-3 py-1.5 text-sm">
                      <span className="w-4 shrink-0 text-xs font-bold text-slate-300">{i + 1}</span>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); setOpenTeam(r.team); }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { e.stopPropagation(); setOpenTeam(r.team); }
                        }}
                        className="flex min-w-0 flex-1 items-center gap-2 font-semibold hover:text-emerald-700"
                      >
                        <Flag code={r.team.flag} className="h-4 w-6 shrink-0" />
                        <span className="truncate">{r.team.name}</span>
                      </span>
                      {started && (
                        <span className="shrink-0 text-xs font-bold tabular-nums text-slate-500">
                          {r.pts} pts
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>
      )}

      {/* ===== Vista de bracket ===== */}
      {view === 'bracket' && (
        <div>
          {champion && (
            <div className="mb-4 flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 px-4 py-3">
              <TrophyBadge className="h-9 w-9" />
              <Flag code={champion.flag} className="h-6 w-9" />
              <span className="text-lg font-black">{champion.name} — ¡CAMPEÓN DEL MUNDO!</span>
            </div>
          )}
          <DragScroller className="pb-2">
            <div className="flex min-w-[1000px] gap-3">
              {(['r32', 'r16', 'qf', 'sf', 'final'] as const).map((stage) => {
                const ms = knockout.filter((m) => m.stage === stage);
                const third = stage === 'final' ? knockout.find((m) => m.stage === 'third') : null;
                return (
                  <div key={stage} className="flex flex-1 flex-col">
                    <h4 className="mb-2 text-center text-xs font-black uppercase tracking-wider text-slate-400">
                      {STAGE_LABEL[stage]}
                    </h4>
                    <div className="flex flex-1 flex-col justify-around gap-2">
                      {ms.map((m) => (
                        <div
                          key={m.id}
                          className={`rounded-xl border bg-white p-2 shadow-sm ${
                            stage === 'final' ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200'
                          }`}
                        >
                          <p className="mb-1 text-[10px] text-slate-400">{fmtDate(m.kickoff)}</p>
                          {[
                            { t: m.home, l: m.homeLabel, s: m.hs, other: m.as },
                            { t: m.away, l: m.awayLabel, s: m.as, other: m.hs },
                          ].map((side, i) => {
                            const winner =
                              m.status === 'finished' && side.s !== null && side.other !== null && side.s > side.other;
                            return (
                              <div key={i} className={`flex items-center justify-between gap-1 ${winner ? '' : 'opacity-80'}`}>
                                <TeamName team={side.t} label={side.l} onSelect={setOpenTeam} />
                                {m.status === 'finished' && (
                                  <span className={`text-sm tabular-nums ${winner ? 'font-black' : 'text-slate-400'}`}>
                                    {side.s}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                          {third && stage === 'final' && null}
                        </div>
                      ))}
                      {stage === 'final' && third && (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
                          <p className="mb-1 text-[10px] font-bold uppercase text-slate-400">3.er puesto · {fmtDate(third.kickoff)}</p>
                          {[
                            { t: third.home, l: third.homeLabel, s: third.hs },
                            { t: third.away, l: third.awayLabel, s: third.as },
                          ].map((side, i) => (
                            <div key={i} className="flex items-center justify-between gap-1">
                              <TeamName team={side.t} label={side.l} onSelect={setOpenTeam} />
                              {third.status === 'finished' && (
                                <span className="text-sm tabular-nums">{side.s}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </DragScroller>
        </div>
      )}

      {/* ===== Modal: detalle de grupo ===== */}
      {openGroup && !openTeam && (
        <Modal onClose={() => setOpenGroup(null)}>
          {(() => {
            const data = byGroup.get(openGroup)!;
            const rows = computeStandings(data.teams, data.matches);
            return (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className={`${GROUP_COLOR[openGroup]} rounded-lg px-3 py-1 text-lg font-black uppercase tracking-wider text-white`}>
                    Grupo {openGroup}
                  </h3>
                  <CloseBtn onClose={() => setOpenGroup(null)} />
                </div>

                <table className="mb-5 w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-wide text-slate-400">
                      <th className="py-1 pr-1 font-medium">#</th>
                      <th className="py-1 font-medium">Equipo</th>
                      <th className="py-1 text-center font-medium">PJ</th>
                      <th className="py-1 text-center font-medium">G</th>
                      <th className="py-1 text-center font-medium">E</th>
                      <th className="py-1 text-center font-medium">P</th>
                      <th className="py-1 text-center font-medium">DG</th>
                      <th className="py-1 text-right font-medium">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={r.team.id} className={`border-t border-slate-100 ${i < 2 ? 'bg-emerald-50/50' : ''}`}>
                        <td className="py-1.5 pr-1 text-xs font-bold text-slate-300">{i + 1}</td>
                        <td className="py-1.5">
                          <button
                            type="button"
                            onClick={() => setOpenTeam(r.team)}
                            className="flex items-center gap-2 font-semibold hover:text-emerald-700"
                          >
                            <Flag code={r.team.flag} className="h-4 w-6" />
                            {r.team.name}
                          </button>
                        </td>
                        <td className="py-1.5 text-center tabular-nums">{r.pj}</td>
                        <td className="py-1.5 text-center tabular-nums">{r.g}</td>
                        <td className="py-1.5 text-center tabular-nums">{r.e}</td>
                        <td className="py-1.5 text-center tabular-nums">{r.p}</td>
                        <td className="py-1.5 text-center tabular-nums">{r.dg > 0 ? `+${r.dg}` : r.dg}</td>
                        <td className="py-1.5 text-right font-black tabular-nums">{r.pts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="-mt-3 mb-4 text-[11px] text-slate-400">
                  Los 2 primeros clasifican directo (+ los 8 mejores terceros).
                </p>

                <h4 className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">Partidos</h4>
                <ul className="space-y-1.5">
                  {data.matches.map((m) => (
                    <li key={m.id} className="flex items-center gap-2 rounded-xl border border-slate-100 px-3 py-2">
                      <div className="flex min-w-0 flex-1 justify-end">
                        <TeamName team={m.home} label={m.homeLabel} onSelect={setOpenTeam} align="right" />
                      </div>
                      <div className="w-20 shrink-0 text-center">
                        <Score m={m} />
                      </div>
                      <div className="flex min-w-0 flex-1">
                        <TeamName team={m.away} label={m.awayLabel} onSelect={setOpenTeam} />
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            );
          })()}
        </Modal>
      )}

      {/* ===== Modal: detalle de país ===== */}
      {openTeam && (
        <Modal onClose={() => setOpenTeam(null)}>
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Flag code={openTeam.flag} className="h-10 w-14" />
              <div>
                <h3 className="text-xl font-black">{openTeam.name}</h3>
                {openTeam.group && (
                  <button
                    type="button"
                    onClick={() => { setOpenGroup(openTeam.group); setOpenTeam(null); }}
                    className={`${GROUP_COLOR[openTeam.group]} mt-1 rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white`}
                  >
                    Grupo {openTeam.group} →
                  </button>
                )}
              </div>
            </div>
            <CloseBtn onClose={() => setOpenTeam(null)} />
          </div>

          <h4 className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">
            Sus partidos ({teamMatches.length})
          </h4>
          <ul className="space-y-1.5">
            {teamMatches.map((m) => {
              const isHome = m.home?.id === openTeam.id;
              const rival = isHome ? m.away : m.home;
              const rivalLabel = isHome ? m.awayLabel : m.homeLabel;
              const my = isHome ? m.hs : m.as;
              const their = isHome ? m.as : m.hs;
              const played = m.status === 'finished' && my !== null && their !== null;
              const res = !played ? null : my! > their! ? 'G' : my! < their! ? 'P' : 'E';
              const resColor =
                res === 'G' ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                : res === 'P' ? 'border-red-300 bg-red-50 text-red-600'
                : 'border-slate-300 bg-slate-50 text-slate-600';
              return (
                <li key={m.id} className="flex items-center gap-2.5 rounded-xl border border-slate-100 px-3 py-2 text-sm">
                  <span className="w-20 shrink-0 text-[11px] text-slate-400">
                    {m.stage === 'group' ? `Grupo ${m.group}` : STAGE_LABEL[m.stage]}
                  </span>
                  <span className="flex min-w-0 flex-1 items-center gap-1.5">
                    <span className="text-[11px] text-slate-400">vs</span>
                    {rival ? (
                      <button
                        type="button"
                        onClick={() => setOpenTeam(rival)}
                        className="flex min-w-0 items-center gap-1.5 font-semibold hover:text-emerald-700"
                      >
                        <Flag code={rival.flag} className="h-4 w-6 shrink-0" />
                        <span className="truncate">{rival.name}</span>
                      </button>
                    ) : (
                      <span className="truncate text-xs italic text-slate-400">{rivalLabel ?? 'por definir'}</span>
                    )}
                  </span>
                  {played ? (
                    <>
                      <span className="font-black tabular-nums">{my} – {their}</span>
                      <span className={`w-6 shrink-0 rounded-md border py-0.5 text-center text-[11px] font-black ${resColor}`}>
                        {res}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-slate-400">{fmtDate(m.kickoff, true)}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </Modal>
      )}
    </div>
  );
}
