# 🏆 Polla Mundial — Mundial 2026

Polla (pool de pronósticos) del Mundial FIFA 2026, jugable en grupo mediante un
**código de sala compartible** (mecánica tipo Ludo: creas sala → compartes código →
tus amigos entran y compiten en un ranking).

- **Plataforma:** Web responsive / **PWA** (se abre con un link, sin instalar de tiendas).
- **Alcance:** Polla **completa** (marcadores de los 104 partidos + bracket + campeón + goleador).
- **Cuentas:** registro real con **correo + contraseña** y tabla de usuario profesional.
- **Dos modos de polla:**
  - 🌍 **Polla global ("la de nosotros")** — oficial, única, todos contra todos. El usuario
    queda inscrito automáticamente al registrarse; juega de una.
  - 🔒 **Pollas privadas con código** — las que creas y compartes con tus amigos (tipo Ludo).
  - Un usuario está en la global **y** en cuantas pollas privadas quiera, en paralelo.
- **Estado:** Documento de diseño. Aún sin código.

---

## 1. Datos base del Mundial 2026

| Dato | Valor |
|---|---|
| Sedes | EE.UU. (11) + México (3) + Canadá (2) = 16 ciudades |
| Equipos | 48 |
| Grupos | 12 (A–L), 4 equipos c/u |
| Partidos | 104 |
| Clasifican | 2 primeros de cada grupo + 8 mejores terceros = 32 a dieciseisavos |
| Inauguración | 11 jun 2026 — México vs Sudáfrica (Estadio Azteca) |
| Final | 19 jul 2026 — MetLife Stadium (NY/NJ) |

**Fases eliminatorias:** Dieciseisavos 28 jun–4 jul · Octavos 5–7 jul · Cuartos 9–12 jul ·
Semis 14–15 jul · 3.er puesto 18 jul · Final 19 jul.

### Los 12 grupos (definitivos, post-repechaje)

| Grupo | Cabeza | Equipos |
|---|---|---|
| A | México | México · Sudáfrica · Corea del Sur · Chequia |
| B | Canadá | Canadá · Bosnia · Qatar · Suiza |
| C | Brasil | Brasil · Marruecos · Haití · Escocia |
| D | EE.UU. | EE.UU. · Paraguay · Australia · Turquía |
| E | Alemania | Alemania · Curazao · Costa de Marfil · Ecuador |
| F | P. Bajos | P. Bajos · Japón · Suecia · Túnez |
| G | Bélgica | Bélgica · Egipto · Irán · Nueva Zelanda |
| H | España | España · Cabo Verde · Arabia Saudita · Uruguay |
| I | Francia | Francia · Senegal · Irak · Noruega |
| J | Argentina | Argentina · Argelia · Austria · Jordania |
| K | Portugal | Portugal · R.D. Congo · Uzbekistán · Colombia |
| L | Inglaterra | Inglaterra · Croacia · Ghana · Panamá |

> ⚠️ **Pendiente de cargar:** el calendario exacto (qué equipo juega contra cuál, día,
> hora y sede de cada uno de los 104 partidos). Los grupos ya están; falta el *fixture*
> oficial día por día para sembrar la base de datos.

---

## 2. Stack técnico recomendado

| Capa | Tecnología | Por qué |
|---|---|---|
| Frontend | **Next.js (React) + TypeScript + Tailwind CSS** | SSR, rutas API, PWA fácil, despliegue gratis |
| PWA | `next-pwa` | Instalable en celular, ícono en home, funciona offline-light |
| Backend + DB | **Supabase** (Postgres + Auth + Realtime) | Maneja códigos de sala, ranking en vivo, free tier generoso |
| Auth | **Supabase Auth (email + contraseña)** | Cuentas reales; perfil profesional en tabla `profiles` |
| Hosting | **Vercel** (front) + Supabase (datos) | Gratis para empezar, escala solo |
| Datos/Resultados | **OpenFootball** (fixture) + **football-data.org** (resultados) + manual | Ver sección 2.1 |

### 2.1 Fuente de datos del Mundial (todo gratis)

| Necesidad | Fuente | Notas |
|---|---|---|
| **Calendario / fixture** (104 partidos, fechas, sedes, grupos) | **OpenFootball** `worldcup.json` | JSON público, **sin API key**. URL: `raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json`. Lo usamos para **sembrar** la BD. ⚠️ No trae marcadores. |
| **Resultados en vivo** | **football-data.org** (tier gratis) | Incluye el Mundial (competición `WC`), key gratuita, ~10 req/min. Un cron sincroniza marcadores cada X min en días de partido. |
| **Respaldo / corrección** | **Panel admin manual** | Siempre disponible. Si la API falla o tarda, el admin carga/ajusta el resultado a mano y se recalcula el puntaje. |

> Alternativas de resultados si football-data.org no alcanza: **API-Football** (api-sports.io,
> 100 req/día gratis) o **TheSportsDB** (gratis). Decisión final al construir la Fase 3.

---

## 3. Modelo de datos

```
auth.users                  -- gestionado por Supabase Auth (email + contraseña)
  id (uuid, pk)
  email (unique)
  encrypted_password        -- Supabase lo maneja; nunca guardamos contraseñas en claro
  email_confirmed_at
  ...

profiles                    -- perfil "profesional", 1-a-1 con auth.users
  id (uuid, pk, fk auth.users.id)
  first_name
  last_name
  username (unique)
  email (unique)            -- espejo del de auth, para consultas
  avatar_url (nullable)
  country (nullable)        -- ej. "CO"
  phone (nullable)
  date_of_birth (nullable)
  role                      -- 'user' | 'admin'  (admin carga resultados)
  is_active (bool)
  last_login_at
  created_at
  updated_at

pools                       -- la "sala"/polla (global o privada)
  id (uuid, pk)
  name
  type                      -- 'global' | 'private'
  code (text, unique, null) -- ej. "WC26-7XK2" en privadas; NULL en la global
  admin_user_id (fk profiles, null para la global)
  scoring_rules (jsonb)     -- reglas configurables (ver sección 5)
  join_deadline (timestamp) -- a partir de aquí ya no se puede entrar / predecir el torneo
  created_at
  -- Existe UNA sola fila con type='global'. Al registrarse, el usuario se inscribe
  -- automáticamente (trigger) creando su membership en esa polla global.

memberships                 -- qué usuario está en qué sala
  id (uuid, pk)
  pool_id (fk pools)
  user_id (fk profiles)
  nickname                  -- nombre dentro de esa sala
  joined_at
  UNIQUE(pool_id, user_id)

teams                       -- catálogo de selecciones
  id (pk)
  name
  flag_code                 -- "MX", "AR", "CO"...
  group_letter              -- A..L

matches                     -- los 104 partidos (datos globales, no por sala)
  id (pk)
  stage                     -- group | r32 | r16 | qf | sf | third | final
  group_letter (nullable)
  home_team_id (fk teams, nullable hasta definir cruces)
  away_team_id (fk teams, nullable)
  kickoff_at (timestamp)    -- al pasar esta hora, se bloquea predecir
  venue
  status                    -- scheduled | live | finished
  home_score (nullable)
  away_score (nullable)
  winner_team_id (nullable) -- para definir cruces de eliminatorias

predictions                 -- pronóstico de un usuario para un partido EN una sala
  id (pk)
  pool_id (fk pools)
  user_id (fk profiles)
  match_id (fk matches)
  pred_home_score
  pred_away_score
  points_awarded (nullable) -- se calcula al finalizar el partido
  UNIQUE(pool_id, user_id, match_id)

special_predictions         -- pronósticos a largo plazo (cierran al inicio del torneo)
  id (pk)
  pool_id (fk pools)
  user_id (fk profiles)
  champion_team_id
  runner_up_team_id
  semifinalist_team_ids (array de 4)
  top_scorer_name
  group_winners (jsonb)     -- {A: teamId, B: teamId, ...}
  points_awarded (nullable)
  UNIQUE(pool_id, user_id)

-- El RANKING se calcula sumando predictions.points_awarded +
-- special_predictions.points_awarded por (pool_id, user_id). Se puede materializar
-- en una vista o tabla cacheada y refrescar vía Realtime.
```

---

## 4. Pantallas (wireframes)

### 4.0 Registro / Login
```
┌───────────────────────────────┐    ┌───────────────────────────────┐
│   Crear cuenta                 │    │   Iniciar sesión               │
│   Nombre:    [ Leonardo ]      │    │   Correo:   [ ___________ ]    │
│   Apellido:  [ ________ ]      │    │   Contraseña:[ ___________ ]   │
│   Usuario:   [ ________ ]      │    │        [  Entrar  ]            │
│   Correo:    [ ________ ]      │    │   ¿Olvidaste tu contraseña?    │
│   Contraseña:[ ________ ]      │    └───────────────────────────────┘
│   País:      [ Colombia ▾]     │
│        [  Registrarme  ]       │  → al registrarte quedas inscrito
└───────────────────────────────┘     automáticamente en la Polla Global
```

### 4.1 Home / Landing
```
┌───────────────────────────────┐
│        🏆 POLLA MUNDIAL       │
│         Mundial 2026           │
│                                │
│   ── Mis pollas ──             │
│   🌍 Polla Global       12.º   │  ← inscrito automáticamente
│   🔒 Polla de la oficina 3.º   │
│   🔒 Familia Pérez       1.º   │
│                                │
│   [  + Crear nueva polla   ]   │
│   [  Unirme con un código  ]   │
└───────────────────────────────┘
```

### 4.2 Crear polla
```
┌───────────────────────────────┐
│  Nueva polla                   │
│  Nombre: [ Polla de la oficina]│
│  Reglas de puntaje:  [ Clásica▾]│
│     (Clásica / Personalizada)  │
│  Cierre de inscripción:        │
│     11 jun 2026, 12:00 (def.)  │
│           [  Crear polla  ]     │
└───────────────────────────────┘
        ↓ al crear
┌───────────────────────────────┐
│  ✅ ¡Polla creada!             │
│  Comparte este código:         │
│        ┌──────────────┐        │
│        │  WC26-7XK2   │ [Copiar]│
│        └──────────────┘        │
│  [ Compartir por WhatsApp ]    │
└───────────────────────────────┘
```

### 4.3 Unirse con código
```
┌───────────────────────────────┐
│  Unirme a una polla            │
│  Código: [ WC26-____ ]         │
│  Tu nombre: [ Leo ]            │
│         [  Entrar  ]           │
└───────────────────────────────┘
```

### 4.4 Lobby de la sala
```
┌───────────────────────────────┐
│  Polla de la oficina           │
│  Código: WC26-7XK2  [Compartir]│
│  👥 8 jugadores                │
│  ⏳ Cierra en 1 día 4 h        │
│  ── Pestañas ──                │
│  [Predicciones][Ranking][Partidos]│
└───────────────────────────────┘
```

### 4.5 Predicciones — fase de grupos
```
┌───────────────────────────────┐
│  GRUPO K                       │
│  Portugal   [2] - [1] R.D.Congo│
│  Colombia   [3] - [0] Uzbekistán│
│  ...                           │
│  Selector de grupo:  A B C ...L│
│  ── Pronóstico maestro ──      │
│  1.º del grupo: [ Colombia ▾]  │
│  2.º del grupo: [ Portugal ▾]  │
│            [ Guardar ]         │
└───────────────────────────────┘
```
> Cada partido se bloquea automáticamente a su hora de inicio (`kickoff_at`).

### 4.6 Predicciones — bracket eliminatorio
```
┌─────────────────────────────────────────┐
│  16avos → 8vos → 4tos → Semis → FINAL    │
│  [llaves interactivas; se habilitan      │
│   cuando se definen los cruces reales]   │
│  Campeón:    [ Argentina ▾ ]  (cierra 11 jun)│
│  Finalista:  [ Francia ▾ ]               │
│  Goleador:   [ Mbappé ]                  │
└─────────────────────────────────────────┘
```

### 4.7 Ranking
```
┌───────────────────────────────┐
│  🏆 Ranking — Polla oficina    │
│  1.º  Ana       142 pts ▲      │
│  2.º  Carlos    138 pts        │
│  3.º  Leo       131 pts ▼      │
│  ...                           │
│  (toca un jugador → ver detalle)│
└───────────────────────────────┘
```

### 4.8 Panel admin (cargar resultados)
```
┌───────────────────────────────┐
│  Resultados (solo admin)       │
│  Colombia [_] - [_] Uzbekistán │
│            [ Guardar resultado]│
│  → al guardar, recalcula puntos│
│    y refresca ranking en vivo  │
└───────────────────────────────┘
```

---

## 5. Sistema de puntos (reglas "Clásicas" por defecto, configurables por sala)

### Por partido jugado
| Fase | Marcador exacto | Solo resultado (1X2) |
|---|---|---|
| Grupos (72) | 5 | 3 |
| Dieciseisavos | 5 | 3 |
| Octavos | 6 | 3 |
| Cuartos | 7 | 4 |
| Semifinales | 8 | 5 |
| 3.er puesto | 6 | 3 |
| Final | 10 | 5 |

### Pronóstico maestro (se cierra el 11 jun a las 12:00)
| Acierto | Puntos |
|---|---|
| 1.º de cada grupo | 3 c/u |
| 2.º de cada grupo | 2 c/u |
| Cada semifinalista (4) | 8 c/u |
| Finalista | 15 |
| **Campeón** | **25** |
| Goleador del torneo | 15 |

> El `admin` puede editar estos valores en `scoring_rules` (jsonb) al crear la polla.

---

## 6. Reglas de negocio clave

1. **Bloqueo por partido:** una predicción solo se puede crear/editar antes del
   `kickoff_at` del partido. Después queda congelada.
2. **Pronóstico maestro** (campeón, goleador, ganadores de grupo): se cierra al inicio
   del torneo (`join_deadline`, por defecto 11 jun 12:00).
3. **Eliminatorias partido a partido:** los cruces no se conocen hasta terminar grupos;
   las llaves se habilitan progresivamente a medida que se definen, y cada partido se
   puntea con su marcador. (Lo de largo plazo —semifinalistas, campeón— ya quedó fijado
   en el pronóstico maestro.)
4. **Recalcular:** al cargar un resultado real, el sistema recalcula `points_awarded` de
   todas las predicciones de ese partido y refresca el ranking (Realtime).
5. **Códigos de sala:** formato `WC26-XXXX` (alfanumérico, sin caracteres ambiguos como
   O/0, I/1). Únicos. El link de WhatsApp incluye el código para entrar con 1 toque.
6. **Una predicción por usuario por partido por sala.** El mismo usuario puede estar en
   varias pollas con pronósticos distintos.

---

## 7. Roadmap de construcción

- **Fase 0 — Datos:** sembrar `teams` (48) y `matches` (104, con calendario oficial).
- **Fase 1 — Núcleo de salas:** crear polla, generar código, unirse, lobby. (la mecánica Ludo)
- **Fase 2 — Predicciones de grupos:** UI de los 12 grupos + bloqueo por kickoff.
- **Fase 3 — Puntaje y ranking:** panel admin de resultados + cálculo + ranking en vivo.
- **Fase 4 — Eliminatorias + pronóstico maestro:** bracket + campeón/goleador.
- **Fase 5 — PWA + pulido:** instalable, compartir por WhatsApp, avatares, notificaciones.

---

## 8. Decisiones (resueltas)

- ✅ **Auth:** correo + contraseña, con tabla de usuario profesional (`profiles`).
- ✅ **Resultados:** API gratuita (football-data.org) + carga manual de respaldo.
- ✅ **Modos de polla:** polla **global** (auto-inscripción) + pollas **privadas por código**.
- ✅ **Fuente del calendario:** OpenFootball `worldcup.json` (gratis, sin key) para sembrar.

Pendientes menores (se cierran al construir):
- Confirmar que la key gratis de football-data.org expone el Mundial con la rapidez deseada.
- ¿Verificación de correo obligatoria al registrarse? (recomendado: sí, pero opcional en MVP).

---

## 9. Calendario — Fase de grupos (72 partidos)

> Fuente: OpenFootball + Sky Sports. Sedes en ciudad. Los horarios exactos se siembran
> desde el JSON de OpenFootball (`time` con zona horaria).

| Fecha | Partidos (sede) |
|---|---|
| Jue 11 jun | México–Sudáfrica (Ciudad de México) |
| Vie 12 jun | Corea del Sur–Chequia (Guadalajara) · Canadá–Bosnia (Toronto) |
| Sáb 13 jun | EE.UU.–Paraguay (Los Ángeles) · Qatar–Suiza (Santa Clara) · Brasil–Marruecos (Nueva Jersey) |
| Dom 14 jun | Haití–Escocia (Foxborough) · Australia–Turquía (Vancouver) · Alemania–Curazao (Houston) · P. Bajos–Japón (Arlington) |
| Lun 15 jun | C. de Marfil–Ecuador (Filadelfia) · Suecia–Túnez (Guadalajara) · España–Cabo Verde (Atlanta) · Bélgica–Egipto (Seattle) · Arabia S.–Uruguay (Miami) |
| Mar 16 jun | Irán–N. Zelanda (Los Ángeles) · Francia–Senegal (Nueva Jersey) · Irak–Noruega (Foxborough) |
| Mié 17 jun | Argentina–Argelia (Kansas City) · Austria–Jordania (Santa Clara) · Portugal–R.D. Congo (Houston) · Inglaterra–Croacia (Arlington) |
| Jue 18 jun | Ghana–Panamá (Toronto) · Uzbekistán–Colombia (Ciudad de México) · Chequia–Sudáfrica (Atlanta) · Suiza–Bosnia (Los Ángeles) · Canadá–Qatar (Vancouver) |
| Vie 19 jun | México–Corea del Sur (Guadalajara) · EE.UU.–Australia (Seattle) · Escocia–Marruecos (Foxborough) |
| Sáb 20 jun | Brasil–Haití (Filadelfia) · Turquía–Paraguay (Santa Clara) · P. Bajos–Suecia (Houston) · Alemania–C. de Marfil (Toronto) |
| Dom 21 jun | Ecuador–Curazao (Kansas City) · Túnez–Japón (Guadalajara) · España–Arabia S. (Atlanta) · Bélgica–Irán (Los Ángeles) · Uruguay–Cabo Verde (Miami) |
| Lun 22 jun | N. Zelanda–Egipto (Vancouver) · Argentina–Austria (Arlington) · Francia–Irak (Filadelfia) |
| Mar 23 jun | Noruega–Senegal (Toronto) · Jordania–Argelia (Santa Clara) · Portugal–Uzbekistán (Houston) · Inglaterra–Ghana (Foxborough) |
| Mié 24 jun | Panamá–Croacia (Foxborough) · Colombia–R.D. Congo (Guadalajara) · Suiza–Canadá (Vancouver) · Bosnia–Qatar (Seattle) · Marruecos–Haití (Atlanta) · Escocia–Brasil (Miami) |
| Jue 25 jun | Sudáfrica–Corea del Sur (Guadalajara) · Chequia–México (Ciudad de México) · Curazao–C. de Marfil (Filadelfia) · Ecuador–Alemania (Nueva Jersey) |
| Vie 26 jun | Túnez–P. Bajos (Kansas City) · Japón–Suecia (Arlington) · Turquía–EE.UU. (Los Ángeles) · Paraguay–Australia (Santa Clara) · Noruega–Francia (Foxborough) · Senegal–Irak (Toronto) |
| Sáb 27 jun | Cabo Verde–Arabia S. (Houston) · Uruguay–España (Guadalajara) · N. Zelanda–Bélgica (Vancouver) · Egipto–Irán (Seattle) · Panamá–Inglaterra (Nueva Jersey) · Croacia–Ghana (Filadelfia) |

**Eliminatorias** (cruces se definen al terminar grupos):
Dieciseisavos 28 jun–4 jul · Octavos 5–7 jul · Cuartos 9–12 jul · Semis 14–15 jul ·
3.er puesto 18 jul · **Final 19 jul (MetLife, NY/NJ)**.

> Nota: "Guadalajara/Zapopan" y "Ciudad de México" (Estadio Azteca) son las sedes mexicanas;
> el resto son de EE.UU. salvo Toronto/Vancouver (Canadá). El JSON de OpenFootball trae la
> sede y hora exactas de cada partido para la siembra.
