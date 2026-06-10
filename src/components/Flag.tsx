// Bandera PNG local de 160px (public/flags/). Los emojis de bandera no se
// renderizan en Windows, y los SVG con escudos detallados pesan cientos de KB
// y traban el scroll al rasterizarse — por eso PNGs pequeños.
export function Flag({
  code,
  className = 'h-5 w-7',
}: {
  code: string | null | undefined;
  className?: string;
}) {
  if (!code) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded bg-slate-100 text-slate-400 ${className}`}
        aria-hidden
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-[60%] w-auto"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8.5 15.3 10.9 14.04 14.8H9.96L8.7 10.9Z" fill="currentColor" stroke="none" />
        </svg>
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- PNG local diminuto; next/image no aporta aquí
    <img
      src={`/flags/${code.toLowerCase()}.png`}
      alt=""
      width={160}
      height={120}
      loading="lazy"
      decoding="async"
      className={`inline-block rounded object-cover shadow-sm ring-1 ring-black/10 ${className}`}
    />
  );
}
