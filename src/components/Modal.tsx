'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconX } from '@/components/Icons';

// Diálogo para rutas interceptadas. En escritorio: ventana centrada. En móvil:
// bottom sheet que se cierra arrastrando hacia abajo desde su cabecera (gesto
// nativo de los teléfonos), además de ✕, ESC, clic afuera o "atrás".
export function Modal({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dismiss = useCallback(() => router.back(), [router]);

  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);

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

  const onTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    setDragging(true);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging) return;
    setDragY(Math.max(0, e.touches[0].clientY - startY.current));
  };
  const onTouchEnd = () => {
    setDragging(false);
    if (dragY > 90) dismiss();
    else setDragY(0);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={dismiss}
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-5"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: dragging ? 'none' : 'transform 0.2s ease-out',
        }}
        className="relative max-h-[94dvh] w-full max-w-5xl overflow-y-auto overscroll-contain rounded-t-3xl bg-slate-50 shadow-2xl sm:max-h-[calc(100dvh-2.5rem)] sm:rounded-3xl"
      >
        {/* Cabecera de arrastre (solo móvil) */}
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className="sticky top-0 z-30 touch-none rounded-t-3xl bg-slate-50/95 pb-1 pt-2.5 backdrop-blur-sm sm:hidden"
        >
          <div className="mx-auto h-1.5 w-12 rounded-full bg-slate-300" />
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-40 flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/40 text-white backdrop-blur-sm transition hover:bg-slate-950/60"
        >
          <IconX className="h-4 w-4" />
        </button>

        <div className="p-3 pt-1.5 sm:p-5 sm:pt-5">{children}</div>
      </div>
    </div>
  );
}
