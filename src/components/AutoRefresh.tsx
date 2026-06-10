'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Refresca los datos del servidor cada N segundos (y al volver a la pestaña).
// Útil en días de partido: los marcadores EN VIVO se actualizan solos.
export function AutoRefresh({ seconds = 45 }: { seconds?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, seconds * 1000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') router.refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [router, seconds]);

  return null;
}
