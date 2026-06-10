'use client';

import { useEffect, useRef, useState } from 'react';
import { IconCalendar, IconDownload } from '@/components/Icons';

type Option = {
  label: string;
  href: string;
  external?: boolean;
  hint?: string;
  icon: 'google' | 'apple' | 'download';
};

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
    <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.2 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.2 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/>
  </svg>
);

const AppleIcon = () => (
  <svg width="15" height="15" viewBox="0 0 384 512" aria-hidden className="fill-slate-800">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.7-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
  </svg>
);

function OptionIcon({ icon }: { icon: Option['icon'] }) {
  if (icon === 'google') return <GoogleIcon />;
  if (icon === 'apple') return <AppleIcon />;
  return <IconDownload className="h-4 w-4 text-slate-500" />;
}

// Botón "Agregar al calendario" con mini-popup: Google / Apple / descarga.
// - mode "event": un solo partido (Google por URL + .ics de descarga).
// - mode "subscribe": feed auto-actualizable (suscripción Google/Apple + .ics).
export function AddToCalendar({
  mode,
  icsPath,
  googleUrl,
  label,
  compact = false,
  align = 'right',
}: {
  mode: 'event' | 'subscribe';
  icsPath: string; // ruta relativa al feed/archivo .ics
  googleUrl?: string; // solo para mode="event" (URL de plantilla de Google)
  label?: string;
  compact?: boolean; // solo el ícono (para filas del calendario)
  align?: 'left' | 'right';
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Las URLs absolutas (webcal/Google) se arman en el cliente con el host real.
  const options: Option[] = (() => {
    if (mode === 'event') {
      return [
        ...(googleUrl
          ? [{ label: 'Google Calendar', href: googleUrl, external: true, icon: 'google' as const }]
          : []),
        {
          label: 'Apple / iPhone / otros',
          href: icsPath,
          hint: 'archivo .ics',
          icon: 'apple' as const,
        },
      ];
    }
    if (typeof window === 'undefined') return [];
    const webcal = `webcal://${window.location.host}${icsPath}`;
    return [
      {
        label: 'Google Calendar',
        href: `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcal)}`,
        external: true,
        hint: 'suscripción · se actualiza solo',
        icon: 'google' as const,
      },
      {
        label: 'Apple / iPhone',
        href: webcal,
        hint: 'suscripción · se actualiza solo',
        icon: 'apple' as const,
      },
      {
        label: 'Descargar .ics',
        href: icsPath,
        hint: 'una sola vez, sin suscripción',
        icon: 'download' as const,
      },
    ];
  })();

  return (
    <div ref={ref} className={`relative inline-block ${open ? 'z-50' : ''}`}>
      {compact ? (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          title="Agregar al calendario"
          className={`flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-emerald-50 hover:text-emerald-600 ${
            open ? 'bg-emerald-50 text-emerald-600' : 'text-slate-300'
          }`}
        >
          <IconCalendar className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 rounded-lg border border-emerald-600 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
        >
          <IconCalendar className="h-3.5 w-3.5" />
          {label ?? 'Agregar al calendario'}
        </button>
      )}

      {open && (
        <div
          className={`absolute top-full z-40 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl shadow-slate-900/20 ring-1 ring-slate-900/5 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
            Agregar al calendario
          </p>
          {options.map((o) => (
            <a
              key={o.label}
              href={o.href}
              {...(o.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition hover:bg-emerald-50"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-white shadow-sm">
                <OptionIcon icon={o.icon} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-tight text-slate-700">
                  {o.label}
                </span>
                {o.hint && (
                  <span className="block text-[11px] leading-tight text-slate-400">{o.hint}</span>
                )}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
