export default function Loading() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="flex gap-1.5">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-10 w-10 rounded-lg bg-slate-200" />
        ))}
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 rounded-2xl bg-slate-200" />
      ))}
    </div>
  );
}
