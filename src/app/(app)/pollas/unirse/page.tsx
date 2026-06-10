'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { joinPool, type PoolState } from '@/lib/actions/pools';

export default function UnirsePollaPage() {
  const [state, formAction, pending] = useActionState<PoolState, FormData>(joinPool, {});

  return (
    <div className="mx-auto w-full max-w-md">
      <Link href="/" className="text-sm text-slate-500 hover:underline">
        ← Volver
      </Link>

      <h1 className="mb-1 mt-4 text-2xl font-black tracking-tight">Unirme a una polla</h1>
      <p className="mb-6 text-sm text-slate-500">
        Escribe el código que te compartió tu amigo (ej.{' '}
        <span className="font-mono">WC26-7XK2</span>).
      </p>

      <form
        action={formAction}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label htmlFor="pool-code" className="mb-1 block text-sm font-medium">
            Código
          </label>
          <input
            id="pool-code"
            name="code"
            required
            autoCapitalize="characters"
            placeholder="WC26-XXXX"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono uppercase tracking-wider outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          />
        </div>

        {state.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {pending ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
