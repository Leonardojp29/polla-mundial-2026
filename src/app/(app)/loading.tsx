export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-9 w-56 rounded-lg bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-36 rounded-2xl bg-slate-200" />
        ))}
      </div>
    </div>
  );
}
