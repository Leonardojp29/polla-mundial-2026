'use client';

import { useActionState } from 'react';
import { updateProfile, changePassword, type ProfileState } from '@/lib/actions/profile';

const field =
  'w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200';

function Msg({ state }: { state: ProfileState }) {
  if (!state.ok && !state.error) return null;
  return (
    <p
      className={`rounded-lg px-3 py-2 text-sm ${
        state.error ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'
      }`}
    >
      {state.ok ?? state.error}
    </p>
  );
}

export function ProfileForms({
  profile,
  hasGoogle,
}: {
  profile: {
    first_name: string;
    last_name: string;
    username: string;
    country: string;
    phone: string;
    date_of_birth: string;
  };
  hasGoogle: boolean;
}) {
  const [pState, pAction, pPending] = useActionState<ProfileState, FormData>(updateProfile, {});
  const [cState, cAction, cPending] = useActionState<ProfileState, FormData>(changePassword, {});

  return (
    <div className="space-y-6">
      {/* Datos del perfil */}
      <form
        action={pAction}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-bold">Mis datos</h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="pf-first" className="mb-1 block text-sm font-medium">
              Nombre *
            </label>
            <input id="pf-first" name="first_name" required defaultValue={profile.first_name} className={field} />
          </div>
          <div>
            <label htmlFor="pf-last" className="mb-1 block text-sm font-medium">
              Apellido
            </label>
            <input id="pf-last" name="last_name" defaultValue={profile.last_name} className={field} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="pf-username" className="mb-1 block text-sm font-medium">
              Usuario
            </label>
            <input id="pf-username" name="username" defaultValue={profile.username} className={field} />
          </div>
          <div>
            <label htmlFor="pf-country" className="mb-1 block text-sm font-medium">
              País
            </label>
            <input id="pf-country" name="country" defaultValue={profile.country} className={field} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="pf-phone" className="mb-1 block text-sm font-medium">
              Teléfono
            </label>
            <input id="pf-phone" name="phone" type="tel" defaultValue={profile.phone} className={field} />
          </div>
          <div>
            <label htmlFor="pf-dob" className="mb-1 block text-sm font-medium">
              Fecha de nacimiento
            </label>
            <input id="pf-dob" name="date_of_birth" type="date" defaultValue={profile.date_of_birth} className={field} />
          </div>
        </div>

        <Msg state={pState} />

        <button
          type="submit"
          disabled={pPending}
          className="rounded-lg bg-emerald-600 px-6 py-2.5 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {pPending ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </form>

      {/* Cambiar contraseña */}
      <form
        action={cAction}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-bold">Cambiar contraseña</h2>
        {hasGoogle && (
          <p className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-800">
            Entraste con Google. Si defines una contraseña aquí, también podrás iniciar sesión
            con tu correo.
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="pw-new" className="mb-1 block text-sm font-medium">
              Nueva contraseña
            </label>
            <input
              id="pw-new"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className={field}
            />
          </div>
          <div>
            <label htmlFor="pw-confirm" className="mb-1 block text-sm font-medium">
              Confirmar contraseña
            </label>
            <input
              id="pw-confirm"
              name="confirm"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className={field}
            />
          </div>
        </div>

        <Msg state={cState} />

        <button
          type="submit"
          disabled={cPending}
          className="rounded-lg border border-emerald-600 px-6 py-2.5 font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60"
        >
          {cPending ? 'Cambiando…' : 'Actualizar contraseña'}
        </button>
      </form>
    </div>
  );
}
