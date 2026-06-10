'use client';

import { useActionState } from 'react';
import { completeProfile, type ProfileState } from '@/lib/actions/profile';
import { CountrySelect } from '@/components/CountrySelect';

const field =
  'w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200';

export function CompleteProfileForm({
  email,
  profile,
}: {
  email: string;
  profile: { first_name: string; last_name: string; username: string; country: string };
}) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(completeProfile, {});

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div>
        <h2 className="text-xl font-bold">¡Ya casi! Completa tu perfil</h2>
        <p className="text-sm text-slate-500">
          Tu cuenta de Google está conectada. Termina estos datos para entrar a la{' '}
          <strong>Polla Global</strong>
        </p>
      </div>

      <div>
        <label htmlFor="cp-email" className="mb-1 block text-sm font-medium">
          Correo (de Google)
        </label>
        <input
          id="cp-email"
          value={email}
          disabled
          className={`${field} cursor-not-allowed bg-slate-50 text-slate-500`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="cp-first" className="mb-1 block text-sm font-medium">
            Nombre *
          </label>
          <input
            id="cp-first"
            name="first_name"
            required
            defaultValue={profile.first_name}
            className={field}
          />
        </div>
        <div>
          <label htmlFor="cp-last" className="mb-1 block text-sm font-medium">
            Apellido
          </label>
          <input id="cp-last" name="last_name" defaultValue={profile.last_name} className={field} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="cp-username" className="mb-1 block text-sm font-medium">
            Usuario *
          </label>
          <input
            id="cp-username"
            name="username"
            required
            defaultValue={profile.username}
            placeholder="leo10"
            className={field}
          />
        </div>
        <div>
          <label htmlFor="cp-country" className="mb-1 block text-sm font-medium">
            País *
          </label>
          <CountrySelect id="cp-country" required defaultValue={profile.country} className={field} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="cp-password" className="mb-1 block text-sm font-medium">
            Contraseña *
          </label>
          <input
            id="cp-password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className={field}
          />
        </div>
        <div>
          <label htmlFor="cp-confirm" className="mb-1 block text-sm font-medium">
            Confirmar contraseña *
          </label>
          <input
            id="cp-confirm"
            name="confirm"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className={field}
          />
        </div>
      </div>
      <p className="text-xs text-slate-500">
        Con esta contraseña también podrás iniciar sesión usando tu correo, sin Google.
      </p>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? 'Guardando…' : 'Completar registro'}
      </button>
    </form>
  );
}
