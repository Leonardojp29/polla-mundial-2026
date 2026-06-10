'use client';

// Paginación simple para listados grandes (20 por página).
export function Pagination({
  page,
  total,
  perPage = 20,
  onChange,
}: {
  page: number;
  total: number;
  perPage?: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  if (pages <= 1) return null;
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  const btn =
    'rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-600';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
      <p className="text-xs text-slate-400">
        {from}–{to} de {total}
      </p>
      <div className="flex items-center gap-2">
        <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} className={btn}>
          ← Anterior
        </button>
        <span className="text-sm tabular-nums text-slate-500">
          {page} / {pages}
        </span>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
          className={btn}
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}
