// Íconos SVG inline (trazos estilo Lucide, MIT). currentColor + tamaño por
// className: sin emojis (no se ven profesionales) y sin dependencias.
import type { ReactNode } from 'react';

function I({
  children,
  className = 'h-4 w-4',
  filled = false,
}: {
  children: ReactNode;
  className?: string;
  filled?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`inline-block shrink-0 align-[-0.18em] ${className}`}
      aria-hidden
    >
      {children}
    </svg>
  );
}

type P = { className?: string };

export const IconTrophy = ({ className }: P) => (
  <I className={className}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </I>
);

export const IconGlobe = ({ className }: P) => (
  <I className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </I>
);

export const IconLock = ({ className }: P) => (
  <I className={className}>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </I>
);

export const IconUsers = ({ className }: P) => (
  <I className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </I>
);

export const IconClock = ({ className }: P) => (
  <I className={className}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </I>
);

export const IconTarget = ({ className }: P) => (
  <I className={className}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </I>
);

export const IconCheck = ({ className }: P) => (
  <I className={className}>
    <path d="M20 6 9 17l-5-5" />
  </I>
);

export const IconTrendingUp = ({ className }: P) => (
  <I className={className}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </I>
);

export const IconCalendar = ({ className }: P) => (
  <I className={className}>
    <rect width="18" height="18" x="3" y="4" rx="2" />
    <path d="M16 2v4" />
    <path d="M8 2v4" />
    <path d="M3 10h18" />
  </I>
);

export const IconMapPin = ({ className }: P) => (
  <I className={className}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </I>
);

export const IconStar = ({ className }: P) => (
  <I className={className} filled>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </I>
);

export const IconChart = ({ className }: P) => (
  <I className={className}>
    <path d="M3 3v18h18" />
    <path d="M18 17V9" />
    <path d="M13 17V5" />
    <path d="M8 17v-3" />
  </I>
);

export const IconFlame = ({ className }: P) => (
  <I className={className}>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </I>
);

export const IconClipboard = ({ className }: P) => (
  <I className={className}>
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M12 11h4" />
    <path d="M12 16h4" />
    <path d="M8 11h.01" />
    <path d="M8 16h.01" />
  </I>
);

export const IconEye = ({ className }: P) => (
  <I className={className}>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </I>
);

export const IconShare = ({ className }: P) => (
  <I className={className}>
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <path d="M12 2v13" />
  </I>
);

export const IconAlert = ({ className }: P) => (
  <I className={className}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </I>
);

export const IconSettings = ({ className }: P) => (
  <I className={className}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </I>
);

export const IconBulb = ({ className }: P) => (
  <I className={className}>
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </I>
);

export const IconNext = ({ className }: P) => (
  <I className={className}>
    <path d="m6 17 5-5-5-5" />
    <path d="m13 17 5-5-5-5" />
  </I>
);

export const IconDownload = ({ className }: P) => (
  <I className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </I>
);

export const IconSearch = ({ className }: P) => (
  <I className={className}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </I>
);

export const IconX = ({ className }: P) => (
  <I className={className}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </I>
);

export const IconPencil = ({ className }: P) => (
  <I className={className}>
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </I>
);

export const IconBall = ({ className }: P) => (
  <I className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8.5 15.3 10.9 14.04 14.8H9.96L8.7 10.9Z" fill="currentColor" stroke="none" />
    <path d="M12 8.5V4.5" />
    <path d="m15.3 10.9 3.8-1.2" />
    <path d="M8.7 10.9 4.9 9.7" />
    <path d="m14.04 14.8 2.3 3.3" />
    <path d="M9.96 14.8l-2.3 3.3" />
  </I>
);

// Posición en el ranking: medalla 1/2/3 o el número plano.
export function RankBadge({
  rank,
  className = 'h-6 w-6 text-[11px]',
}: {
  rank: number;
  className?: string;
}) {
  if (rank > 3) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center font-bold text-slate-400 ${className}`}
      >
        {rank}
      </span>
    );
  }
  const style =
    rank === 1
      ? 'bg-amber-400 text-amber-950 ring-amber-500/40'
      : rank === 2
        ? 'bg-slate-300 text-slate-700 ring-slate-400/40'
        : 'bg-orange-300 text-orange-950 ring-orange-400/40';
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-black ring-2 ${style} ${className}`}
    >
      {rank}
    </span>
  );
}

// Punto rojo pulsante de "en vivo".
export function LiveDot({ className = 'h-2 w-2' }: P) {
  return (
    <span className={`relative inline-flex shrink-0 ${className}`} aria-hidden>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
      <span className="relative inline-flex h-full w-full rounded-full bg-red-500" />
    </span>
  );
}
