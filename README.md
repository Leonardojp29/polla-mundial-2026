# 🏆 Polla Mundial — Mundial 2026

Polla del Mundial FIFA 2026 jugable en grupo con un **código compartible** (tipo Ludo):
te registras → juegas la **Polla Global** automáticamente, o **creas una polla privada** y
compartes el código con tus amigos.

> Diseño completo del producto: [docs/DISEÑO.md](docs/DISEÑO.md)

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind v4) — PWA en el roadmap
- **Supabase** (Postgres + Auth + RLS) — local con Docker en desarrollo
- Datos del Mundial sembrados desde **OpenFootball** (gratis, sin API key)

## Requisitos

- Node 20+ y Docker (para Supabase local)

## Cómo correr en local

```bash
# 1. Instalar dependencias
npm install

# 2. Levantar Supabase local (Postgres + Auth). Primera vez baja imágenes de Docker.
npx supabase start

# 3. Aplicar el esquema (tablas, RLS, funciones, polla global, trigger de alta)
npx supabase db reset

# 4. Sembrar equipos (48) y partidos (104) desde OpenFootball
node scripts/seed.mjs

# 5. Descargar las 48 banderas SVG (una sola vez)
node scripts/download-flags.mjs

# 6. Arrancar la app
npm run dev    # http://localhost:3000
```

## Resultados automáticos (football-data.org)

1. Regístrate gratis en [football-data.org](https://www.football-data.org/client/register)
   y pega el token que llega por correo en `.env.local` → `FOOTBALL_DATA_API_TOKEN=...`
2. Comandos:
   ```bash
   npm run sync:dry    # previsualiza qué aplicaría, sin escribir nada
   npm run sync        # un ciclo: aplica resultados + recalcula puntos
   npm run sync:watch  # loop cada 2 min (déjalo corriendo en días de partido)
   ```
El sync usa 1 sola petición por ciclo (tier gratis: 10/min), respeta los headers de
rate-limit, marca partidos EN VIVO con marcador parcial, asigna equipos a los cruces
cuando se definen, y al finalizar un partido recalcula los puntos de todas las pollas.
El panel `/admin` sigue disponible para corregir cualquier cosa a mano.

## Administrador (cargar resultados)

```bash
node scripts/make-admin.mjs tu-correo@ejemplo.com
```
Aparece "⚙️ Admin" en la barra → en `/admin` cargas el marcador real de cada partido y
los puntos de TODAS las pollas se recalculan al instante.

## Login con Google (opcional)

1. Ve a [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
   y crea un proyecto (ej. "Polla Mundial").
2. Configura la **pantalla de consentimiento** (OAuth consent screen → External). Mientras la
   app esté en modo *Testing*, agrega como **Test users** los correos que vayan a entrar.
3. Create credentials → **OAuth client ID** → tipo **Web application**:
   - Authorized JavaScript origins: `http://localhost:3000`
   - **Authorized redirect URIs:** `http://127.0.0.1:54321/auth/v1/callback`
4. Copia el Client ID y el Client Secret en `supabase/.env.local`
   (plantilla: `supabase/.env.local.example`; el archivo está ignorado por git).
5. Reinicia Supabase cargando las credenciales: `npm run db:restart`

El botón "Continuar con Google" ya está en login y registro.

Las llaves locales de Supabase ya están en `.env.local` (son los valores por defecto del
stack local, no sirven en producción).

## Pruebas

```bash
node scripts/e2e.mjs   # valida alta de usuario, auto-inscripción, crear/unirse, ranking y RLS
```

## Rendimiento

- **Datos públicos cacheados**: equipos/partidos se sirven del Data Cache de Next
  (60 s + tag `public-data`, invalidado al instante cuando el admin guarda un resultado).
- **`cache()` por request**: usuario/perfil/polla se consultan una sola vez aunque
  layout y página los pidan.
- **Leaderboard en 1 consulta** agregada (antes: subqueries por jugador).
- **Banderas SVG locales** + imágenes con `Cache-Control: immutable` (1 año).
- **Skeletons** (`loading.tsx`) para carga percibida instantánea + fuente con `swap`.

## ¿Qué hay hecho (Fases 0–3)?

- ✅ Registro / login con correo y contraseña (perfil profesional en `profiles`).
- ✅ Auto-inscripción a la **Polla Global** al registrarse (trigger).
- ✅ Crear **pollas privadas** con código único (`WC26-XXXX`) y unirse con el código.
- ✅ Lobby con compartir código (Copiar / WhatsApp) y **ranking** en vivo (RPC).
- ✅ Base sembrada: 48 equipos + 104 partidos (grupos + eliminatorias).
- ✅ RLS: cada quien ve solo sus datos; las pollas privadas no se filtran.
- ✅ **Predicciones de fase de grupos**: los 12 grupos (72 partidos) con marcador,
  banderas, bloqueo automático al inicio de cada partido y progreso por grupo.
- ✅ Diseño de escritorio (navbar, grids, sidebar) + responsive móvil.
- ✅ **Panel admin** (`/admin`): cargar/corregir/reabrir resultados con recálculo
  automático de puntos en todas las pollas (validado por rol en la BD); asignar
  equipos a los cruces; goleador real + recálculo de pronósticos maestros.
- ✅ **Login con Google** (OAuth) además de correo + contraseña.
- ✅ Banderas SVG reales (los emojis no se ven en Windows) + hero visual del torneo.
- ✅ **Eliminatorias**: predecir cada cruce (r32 → final) a medida que se definen.
- ✅ **⭐ Pronóstico maestro**: campeón (25), finalista (15), 4 semifinalistas (8 c/u),
  goleador (15), 1.º/2.º de cada grupo (3/2) — cierra al iniciar el torneo; el
  puntaje se calcula progresivamente con lo ya decidido.
- ✅ **Perfil** (`/perfil`): editar datos personales y cambiar contraseña.
- ✅ Logo oficial del Mundial 2026 (emblema, vía Wikipedia — ver nota de marca).

> **Nota de marca:** el emblema FIFA 2026 es marca registrada de FIFA. Para uso
> privado entre amigos no hay problema práctico, pero si la app se publica
> comercialmente se debe reemplazar por un logo propio.

## Siguiente (Fase 5+)

- Sincronización automática de resultados (API football-data.org como apoyo al admin).
- PWA instalable + deploy (Supabase Cloud + Vercel).
