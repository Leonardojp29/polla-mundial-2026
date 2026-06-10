'use client';

import { useState } from 'react';
import { IconShare } from '@/components/Icons';

// Genera la tarjeta PNG del pronóstico maestro y la comparte (Web Share API)
// o la descarga si el navegador no soporta compartir archivos (escritorio).
export function ShareMaestroButton({ poolId }: { poolId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function share() {
    setBusy(true);
    setError(false);
    try {
      const res = await fetch(`/api/share/maestro/${poolId}`);
      if (!res.ok) throw new Error('sin pronóstico');
      const blob = await res.blob();
      const file = new File([blob], 'mi-pronostico-mundial2026.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Mi pronóstico — Polla Mundial 2026',
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      // Cancelar el diálogo de compartir no es un error.
      if (!(e instanceof DOMException && e.name === 'AbortError')) setError(true);
    }
    setBusy(false);
  }

  return (
    <div className="mt-4 text-center">
      <button
        type="button"
        onClick={share}
        disabled={busy}
        className="rounded-xl border border-emerald-600 px-5 py-2.5 font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60"
      >
        {busy ? (
          'Generando imagen…'
        ) : (
          <>
            <IconShare className="mr-1.5 h-4 w-4" /> Compartir mi pronóstico
          </>
        )}
      </button>
      {error && (
        <p className="mt-2 text-xs text-red-600">
          No se pudo generar la imagen. ¿Ya guardaste tu pronóstico maestro?
        </p>
      )}
    </div>
  );
}
