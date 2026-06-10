#!/usr/bin/env bash
# (Re)inicia Supabase local cargando las credenciales de supabase/.env.local
# (necesario para que el login con Google funcione). Los datos NO se pierden.
set -e
cd "$(dirname "$0")/.."

if [ -f supabase/.env.local ]; then
  set -a
  # shellcheck disable=SC1091
  source supabase/.env.local
  set +a
  echo "✔ Credenciales de Google cargadas desde supabase/.env.local"
else
  echo "ℹ No existe supabase/.env.local — el login con Google quedará deshabilitado."
  echo "  Copia supabase/.env.local.example y pega tus credenciales."
fi

npx supabase stop 2>/dev/null || true
npx supabase start
