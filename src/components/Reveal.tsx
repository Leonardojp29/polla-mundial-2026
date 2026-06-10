'use client';

import { useEffect, useRef, useState } from 'react';

// Aparece con fade + desplazamiento al entrar en pantalla (una sola vez).
// El retraso escalonado se pasa en segundos: <Reveal delay={0.15}>…
export function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-visible={visible}
      className={`reveal ${className}`}
      style={delay ? ({ '--d': `${delay}s` } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
