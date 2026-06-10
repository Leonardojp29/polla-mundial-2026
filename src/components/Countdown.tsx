'use client';

import { useEffect, useState } from 'react';

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

// Cuenta regresiva al pitazo inicial. Se monta en cliente para evitar
// desfase de hidratación (el servidor no sabe la hora exacta del cliente).
export function Countdown({ targetIso }: { targetIso: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const target = Date.parse(targetIso);
  const t = now === null ? null : parts(target - now);

  const cell = (value: string, label: string) => (
    <div className="flex w-16 flex-col items-center rounded-xl bg-white/10 px-2 py-2 backdrop-blur-sm sm:w-20">
      <span className="text-2xl font-black tabular-nums sm:text-3xl">{value}</span>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-200">
        {label}
      </span>
    </div>
  );

  return (
    <div className="flex gap-2" role="timer" aria-label="Cuenta regresiva al inicio del Mundial">
      {cell(t ? String(t.d) : '–', 'días')}
      {cell(t ? String(t.h).padStart(2, '0') : '––', 'horas')}
      {cell(t ? String(t.m).padStart(2, '0') : '––', 'min')}
      {cell(t ? String(t.s).padStart(2, '0') : '––', 'seg')}
    </div>
  );
}
