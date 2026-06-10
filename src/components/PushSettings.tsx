'use client';

import { useEffect, useState } from 'react';
import { savePushSubscription, removePushSubscription } from '@/lib/actions/push';

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

type State = 'unsupported' | 'loading' | 'off' | 'on' | 'denied';

// Activar/desactivar recordatorios push: "tu predicción cierra en ~2 h".
export function PushSettings() {
  const [state, setState] = useState<State>('loading');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setState('denied');
      return;
    }
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setState(sub ? 'on' : 'off'))
      .catch(() => setState('unsupported'));
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'off');
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '',
        ),
      });
      const { ok } = await savePushSubscription(sub.toJSON() as never);
      setState(ok ? 'on' : 'off');
    } catch {
      setState('off');
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setState('off');
    } finally {
      setBusy(false);
    }
  }

  if (state === 'unsupported') return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold">Recordatorios</h2>
      <p className="mt-1 text-sm text-slate-500">
        Te avisamos en este dispositivo cuando te falte pronosticar un partido que cierra en
        ~2 horas.
      </p>
      {state === 'denied' ? (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Las notificaciones están bloqueadas para este sitio. Actívalas desde la configuración
          del navegador y recarga.
        </p>
      ) : (
        <button
          type="button"
          disabled={busy || state === 'loading'}
          onClick={state === 'on' ? disable : enable}
          className={`mt-4 rounded-lg px-6 py-2.5 font-semibold transition disabled:opacity-60 ${
            state === 'on'
              ? 'border border-slate-300 text-slate-600 hover:bg-slate-50'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          {state === 'loading'
            ? 'Comprobando…'
            : busy
              ? 'Un momento…'
              : state === 'on'
                ? 'Desactivar recordatorios'
                : 'Activar recordatorios'}
        </button>
      )}
      {state === 'on' && (
        <p className="mt-2 text-xs text-emerald-700">Recordatorios activados en este dispositivo.</p>
      )}
    </div>
  );
}
