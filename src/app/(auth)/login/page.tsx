'use client';

import { useActionState, useEffect, useState } from 'react';
import Link from 'next/link';
import { login, type AuthState } from '@/lib/actions/auth';
// Google deshabilitado temporalmente (pendiente dominio corporativo / infra).
// import { GoogleButton } from '@/components/GoogleButton';

const field =
  'w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200';

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(login, {});
  const [oauthError, setOauthError] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('error') === 'oauth') {
      setOauthError(true);
    }
  }, []);

  return (
    <>
      <form
        action={formAction}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div>
          <h2 className="text-xl font-bold">Iniciar sesión</h2>
          <p className="text-sm text-slate-500">Bienvenido de vuelta.</p>
        </div>

        <div>
          <label htmlFor="login-email" className="mb-1 block text-sm font-medium">
            Correo
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={field}
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="login-password" className="block text-sm font-medium">
              Contraseña
            </label>
            <Link
              href="/recuperar"
              className="text-xs font-medium text-emerald-700 hover:underline"
            >
              ¿La olvidaste?
            </Link>
          </div>
          <input
            id="login-password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={field}
          />
        </div>

        {(state.error || oauthError) && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {state.error ?? 'No se pudo iniciar sesión con Google. Intenta de nuevo.'}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {pending ? 'Entrando…' : 'Entrar'}
        </button>

        {/* Google deshabilitado temporalmente (pendiente dominio corporativo / infra).
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          o
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <GoogleButton />
        */}
      </form>

      <p className="mt-4 text-center text-sm text-slate-600">
        ¿No tienes cuenta?{' '}
        <Link href="/registro" className="font-semibold text-emerald-700 hover:underline">
          Crear cuenta
        </Link>
      </p>
    </>
  );
}
