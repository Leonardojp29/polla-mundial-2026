'use client';

import { useState } from 'react';

export function ShareCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const text = `¡Únete a mi polla del Mundial 2026 en Polla Mundial! 🏆\nCódigo: ${code}`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(text)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard no disponible */
    }
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
    </div>
  );
}
