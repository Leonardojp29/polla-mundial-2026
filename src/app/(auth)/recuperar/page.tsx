'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { requestPasswordReset, type AuthState } from '@/lib/actions/auth';

const field =
  'w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200';

export default function RecuperarPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    requestPasswordReset,
    {},
  );

  return (
    <>
      <form
        action={formAction}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div>
          <h2 className="text-xl font-bold">Recuperar contraseña</h2>
          <p className="text-sm text-slate-500">
            Te enviaremos un enlace a tu correo para que definas una nueva.
          </p>
        </div>

        <div>
          <label htmlFor="rec-email" className="mb-1 block text-sm font-medium">
            Correo
          </label>
          <input
            id="rec-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={field}
          />
        </div>

        {state.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
        )}
        {state.ok && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.ok}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {pending ? 'Enviando…' : 'Enviarme el enlace'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-600">
        <Link href="/login" className="font-semibold text-emerald-700 hover:underline">
          ← Volver a iniciar sesión
        </Link>
      </p>
    </>
  );
}
