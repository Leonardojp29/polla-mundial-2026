// Avatar: foto (Google) o iniciales sobre un color estable derivado del nombre.
const COLORS = [
  'bg-emerald-600',
  'bg-sky-600',
  'bg-violet-600',
  'bg-rose-600',
  'bg-amber-600',
  'bg-teal-600',
  'bg-indigo-600',
  'bg-fuchsia-600',
];

export function Avatar({
  name,
  url,
  className = 'h-8 w-8 text-xs',
}: {
  name: string;
  url?: string | null;
  className?: string;
}) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- avatar remoto (Google); no pasa por next/image
      <img
        src={url}
        alt=""
        referrerPolicy="no-referrer"
        loading="lazy"
        className={`shrink-0 rounded-full object-cover ring-1 ring-black/10 ${className}`}
      />
    );
  }
  const initials =
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || '?';
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 select-none items-center justify-center rounded-full font-bold text-white ${COLORS[hash % COLORS.length]} ${className}`}
    >
      {initials}
    </span>
  );
}
