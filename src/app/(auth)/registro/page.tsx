'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { register, type AuthState } from '@/lib/actions/auth';
import { CountrySelect } from '@/components/CountrySelect';

const field =
  'w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200';

export default function RegistroPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(register, {});

  return (
    <>
      <form
        action={formAction}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div>
          <h2 className="text-xl font-bold">Crear cuenta</h2>
          <p className="text-sm text-slate-500">
            Al registrarte quedas inscrito automáticamente en la{' '}
            <strong>Polla Global</strong> 🌍
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="reg-first" className="mb-1 block text-sm font-medium">
              Nombre *
            </label>
            <input id="reg-first" name="first_name" required className={field} />
          </div>
          <div>
            <label htmlFor="reg-last" className="mb-1 block text-sm font-medium">
              Apellido
            </label>
            <input id="reg-last" name="last_name" className={field} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="reg-username" className="mb-1 block text-sm font-medium">
              Usuario
            </label>
            <input id="reg-username" name="username" className={field} placeholder="leo10" />
          </div>
          <div>
            <label htmlFor="reg-country" className="mb-1 block text-sm font-medium">
              País
            </label>
            <CountrySelect id="reg-country" className={field} />
          </div>
        </div>

        <div>
          <label htmlFor="reg-email" className="mb-1 block text-sm font-medium">
            Correo *
          </label>
          <input
            id="reg-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={field}
          />
        </div>

        <div>
          <label htmlFor="reg-password" className="mb-1 block text-sm font-medium">
            Contraseña *
          </label>
          <input
            id="reg-password"
            name="password"
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
          {pending ? 'Creando…' : 'Registrarme'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-600">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="font-semibold text-emerald-700 hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </>
  );
}
