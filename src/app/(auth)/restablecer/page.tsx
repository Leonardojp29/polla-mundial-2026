'use client';

import { useActionState } from 'react';
import { resetPassword, type AuthState } from '@/lib/actions/auth';

const field =
  'w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200';

// Llega aquí desde el enlace del correo (ya con sesión temporal de recuperación).
export default function RestablecerPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(resetPassword, {});

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div>
        <h2 className="text-xl font-bold">Nueva contraseña</h2>
        <p className="text-sm text-slate-500">Define la nueva contraseña de tu cuenta.</p>
      </div>

      <div>
        <label htmlFor="rs-password" className="mb-1 block text-sm font-medium">
          Nueva contraseña
        </label>
        <input
          id="rs-password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className={field}
        />
      </div>

      <div>
        <label htmlFor="rs-confirm" className="mb-1 block text-sm font-medium">
          Confirmar contraseña
        </label>
        <input
          id="rs-confirm"
          name="confirm"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className={field}
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
        {pending ? 'Guardando…' : 'Guardar y entrar'}
      </button>
    </form>
  );
}
