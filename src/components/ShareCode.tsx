'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import { IconX } from '@/components/Icons';

export function ShareCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');
  const [showQr, setShowQr] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => setOrigin(window.location.origin), []);

  const inviteLink = origin ? `${origin}/invitacion/${code}` : '';
  const text = `¡Únete a mi polla del Mundial 2026 en Polla Mundial!\nCódigo: ${code}${
    inviteLink ? `\nO únete directo aquí: ${inviteLink}` : ''
  }`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(text)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(inviteLink || code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard no disponible */
    }
  }

  async function openQr() {
    if (!qrUrl && inviteLink) {
      try {
        setQrUrl(
          await QRCode.toDataURL(inviteLink, {
            width: 480,
            margin: 1,
            color: { dark: '#022c22', light: '#ffffff' },
          }),
        );
      } catch {
        return;
      }
    }
    setShowQr(true);
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
      <p className="mb-2 text-sm font-medium text-emerald-800">Comparte este código:</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-center text-lg font-bold tracking-widest text-emerald-700">
          {code}
        </code>
        <button
          onClick={copy}
          title="Copia el link de invitación"
          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          {copied ? '¡Copiado!' : 'Copiar'}
        </button>
      </div>
      <a
        href={whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 block rounded-lg bg-[#25D366] px-3 py-2 text-center text-sm font-semibold text-white transition hover:opacity-90"
      >
        Compartir por WhatsApp
      </a>
      <button
        type="button"
        onClick={openQr}
        className="mt-2 block w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-center text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
      >
        Mostrar QR de esta polla
      </button>

      {/* Modal del QR: en portal al <body> — el sidebar es sticky (stacking
          context) y sin portal el botón "Guardar pronósticos" quedaba encima. */}
      {showQr &&
        createPortal(
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setShowQr(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-5 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xs rounded-3xl bg-white p-6 text-center shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setShowQr(false)}
              aria-label="Cerrar"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
            >
              <IconX className="h-4 w-4" />
            </button>
            <p className="text-sm font-bold text-slate-700">Escanea para unirte</p>
            {qrUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- data URL generada en el cliente
              <img src={qrUrl} alt={`QR para unirse con el código ${code}`} className="mx-auto mt-3 w-full rounded-xl" />
            )}
            <code className="mt-3 inline-block rounded-lg bg-emerald-50 px-3 py-1.5 text-lg font-bold tracking-widest text-emerald-700">
              {code}
            </code>
            <p className="mt-2 text-xs text-slate-400">
              El QR abre el link de invitación de esta polla.
            </p>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
