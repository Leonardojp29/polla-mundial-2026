// Esqueletos de carga: el popup/página abre al instante y el contenido real
// llega por streaming (loading.tsx de cada ruta).

function Block({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-200/80 ${className}`} />;
}

export function TeamProfileSkeleton() {
  return (
    <div className="space-y-3.5">
      <Block className="h-28" />
      <Block className="h-10 rounded-xl" />
      <div className="grid gap-2 sm:grid-cols-3">
        <Block className="h-20 rounded-xl" />
        <Block className="h-20 rounded-xl" />
        <Block className="hidden h-20 rounded-xl sm:block" />
      </div>
      <div className="grid items-start gap-3.5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-1.5">
          <Block className="h-11 rounded-xl" />
          <Block className="h-11 rounded-xl" />
          <Block className="h-11 rounded-xl" />
        </div>
        <Block className="h-72" />
      </div>
    </div>
  );
}

export function MatchDetailSkeleton() {
  return (
    <div className="space-y-3.5">
      <Block className="h-44" />
      <Block className="h-12 rounded-xl" />
      <Block className="h-24" />
      <Block className="h-32" />
    </div>
  );
}
