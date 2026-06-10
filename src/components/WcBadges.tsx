// Insignias con fotos reales del Mundial (public/img/wc26/, ver
// scripts/download-wc26-assets.mjs): el trofeo de la Copa, el balón Trionda
// y el emblema oficial. Imágenes locales diminutas con caché inmutable.

export function TrophyBadge({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- webp local diminuto
    <img
      src="/img/wc26/trophy.webp"
      alt=""
      width={256}
      height={256}
      loading="lazy"
      decoding="async"
      className={`inline-block shrink-0 object-contain drop-shadow-sm ${className}`}
    />
  );
}

export function BallBadge({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- webp local diminuto
    <img
      src="/img/wc26/ball.webp"
      alt=""
      width={256}
      height={256}
      loading="lazy"
      decoding="async"
      className={`inline-block shrink-0 rounded-full object-cover shadow-sm ring-1 ring-slate-200 ${className}`}
    />
  );
}

// Escudo de La Polla Líbero (public/img/lapolla-libero.png subido a mano;
// aquí va la versión optimizada de 256px, con fondo transparente).
export function GlobalBadge({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- webp local diminuto
    <img
      src="/img/lapolla-libero.webp"
      alt=""
      width={219}
      height={256}
      loading="lazy"
      decoding="async"
      className={`inline-block shrink-0 object-contain ${className}`}
    />
  );
}

// Emblema oficial 2026 (la silueta del trofeo formando el "26").
export function Wc26Emblem({ className = 'h-6 w-auto' }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG local
    <img
      src="/img/wc26-logo.svg"
      alt=""
      width={32}
      height={49}
      loading="lazy"
      decoding="async"
      className={`inline-block shrink-0 ${className}`}
    />
  );
}
