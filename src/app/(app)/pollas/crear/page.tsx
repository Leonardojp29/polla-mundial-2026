'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { createPool, type PoolState } from '@/lib/actions/pools';

export default function CrearPollaPage() {
  const [state, formAction, pending] = useActionState<PoolState, FormData>(createPool, {});

  return (
    <div className="mx-auto w-full max-w-md">
      <Link href="/" className="text-sm text-slate-500 hover:underline">
        ← Volver
      </Link>

      <h1 className="mb-1 mt-4 text-2xl font-black tracking-tight">Nueva polla</h1>
      <p className="mb-6 text-sm text-slate-500">
        Crea tu polla privada y comparte el código con tus amigos.
      </p>

      <form
        action={formAction}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label htmlFor="pool-name" className="mb-1 block text-sm font-medium">
            Nombre de la polla
          </label>
          <input
            id="pool-name"
            name="name"
            required
            maxLength={60}
            placeholder="Polla de la oficina"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
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
          {pending ? 'Creando…' : 'Crear polla'}
        </button>
      </form>
    </div>
  );
}
