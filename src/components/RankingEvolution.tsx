// Gráfico de evolución del ranking (SVG puro, render en servidor): puntos
// acumulados por jugador a lo largo de los días con partidos finalizados.

export type TimelineRow = {
  user_id: string;
  display_name: string;
  day: string; // fecha (Lima)
  points: number;
};

const COLORS = ['#059669', '#0284c7', '#d97706', '#dc2626', '#7c3aed', '#0d9488', '#db2777'];

const W = 640;
const H = 240;
const PAD = { top: 14, right: 16, bottom: 26, left: 34 };

export function RankingEvolution({
  rows,
  currentUserId,
}: {
  rows: TimelineRow[];
  currentUserId: string | null;
}) {
  if (rows.length === 0) return null;

  const days = [...new Set(rows.map((r) => r.day))].sort();
  if (days.length < 2) return null; // con 1 solo día no hay línea que dibujar

  // Acumulado por usuario y día (arrastrando el valor anterior).
  const byUser = new Map<string, { name: string; cum: number[] }>();
  for (const r of rows) {
    if (!byUser.has(r.user_id)) {
      byUser.set(r.user_id, { name: r.display_name, cum: new Array(days.length).fill(0) });
    }
    byUser.get(r.user_id)!.cum[days.indexOf(r.day)] += Number(r.points);
  }
  for (const u of byUser.values()) {
    for (let i = 1; i < u.cum.length; i++) u.cum[i] += u.cum[i - 1];
  }

  // Top 6 por puntaje final + el usuario actual siempre incluido.
  const sorted = [...byUser.entries()].sort(
    (a, b) => b[1].cum[days.length - 1] - a[1].cum[days.length - 1],
  );
  let shown = sorted.slice(0, 6);
  if (currentUserId && !shown.some(([id]) => id === currentUserId)) {
    const me = sorted.find(([id]) => id === currentUserId);
    if (me) shown = [...shown.slice(0, 5), me];
  }

  const maxY = Math.max(1, ...shown.map(([, u]) => u.cum[days.length - 1]));
  const x = (i: number) => PAD.left + (i / (days.length - 1)) * (W - PAD.left - PAD.right);
  const y = (v: number) => H - PAD.bottom - (v / maxY) * (H - PAD.top - PAD.bottom);

  const dayLabel = (d: string) => {
    const [, m, dd] = d.split('-');
    return `${Number(dd)}/${Number(m)}`;
  };
  // Hasta ~6 etiquetas en el eje X.
  const step = Math.max(1, Math.ceil(days.length / 6));

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-1 text-sm font-black tracking-tight">Evolución del ranking</h2>
      <p className="mb-3 text-xs text-slate-400">
        Puntos acumulados por día de partidos (sin contar el pronóstico maestro).
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Evolución de puntos">
        {/* Rejilla horizontal */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(maxY * f)}
              y2={y(maxY * f)}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
            <text x={PAD.left - 6} y={y(maxY * f) + 3.5} textAnchor="end" fontSize="10" fill="#94a3b8">
              {Math.round(maxY * f)}
            </text>
          </g>
        ))}
        {/* Eje X */}
        {days.map((d, i) =>
          i % step === 0 || i === days.length - 1 ? (
            <text key={d} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="#94a3b8">
              {dayLabel(d)}
            </text>
          ) : null,
        )}
        {/* Líneas por jugador */}
        {shown.map(([id, u], idx) => {
          const color = COLORS[idx % COLORS.length];
          const isMe = id === currentUserId;
          return (
            <g key={id}>
              <polyline
                points={u.cum.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
                fill="none"
                stroke={color}
                strokeWidth={isMe ? 3.5 : 2}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={isMe ? 1 : 0.85}
              />
              <circle
                cx={x(days.length - 1)}
                cy={y(u.cum[days.length - 1])}
                r={isMe ? 4.5 : 3.5}
                fill={color}
              />
            </g>
          );
        })}
      </svg>
      {/* Leyenda */}
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
        {shown.map(([id, u], idx) => (
          <li key={id} className="flex items-center gap-1.5 text-xs">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
            />
            <span className={id === currentUserId ? 'font-bold' : 'text-slate-600'}>
              {u.name}
              {id === currentUserId && ' (tú)'}
            </span>
            <span className="font-black tabular-nums text-slate-700">
              {u.cum[days.length - 1]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
