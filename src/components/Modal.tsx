'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IconX } from '@/components/Icons';

// Diálogo para rutas interceptadas: se cierra con ✕, ESC, clic afuera o el
// botón "atrás" del navegador (la URL es compartible y al recargar se ve la
// página completa).
export function Modal({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dismiss = useCallback(() => router.back(), [router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [dismiss]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={dismiss}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm sm:p-5"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-dvh w-full max-w-5xl overflow-y-auto bg-slate-50 shadow-2xl sm:max-h-[calc(100dvh-2.5rem)] sm:rounded-3xl"
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/40 text-white backdrop-blur-sm transition hover:bg-slate-950/60"
        >
          <IconX className="h-4 w-4" />
        </button>
        <div className="p-3 sm:p-5">{children}</div>
      </div>
    </div>
  );
}
