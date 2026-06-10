// Sincroniza resultados del Mundial 2026 desde football-data.org hacia la BD.
//
//   node scripts/sync-results.mjs          → un ciclo (aplica cambios)
//   node scripts/sync-results.mjs --dry    → muestra qué haría, sin escribir
//   node scripts/sync-results.mjs --watch  → loop continuo (días de partido)
//
// Requiere FOOTBALL_DATA_API_TOKEN en .env.local (header X-Auth-Token).
// Usa 1 sola petición por ciclo y respeta los headers de rate-limit del API
// (tier gratis: 10 req/min). Los partidos finalizados disparan el recálculo de
// puntos en la BD; el panel /admin sigue disponible para corregir a mano.
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// --- env ---
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const TOKEN = process.env.FOOTBALL_DATA_API_TOKEN;
if (!TOKEN) {
  console.error('❌ Falta FOOTBALL_DATA_API_TOKEN en .env.local');
  console.error('   Pega ahí el token que te llegó por correo y vuelve a ejecutar.');
  process.exit(1);
}
const svc = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const DRY = process.argv.includes('--dry');
const WATCH = process.argv.includes('--watch');
const INTERVAL_S = 120;

// --- normalización de nombres (football-data.org → nuestros equipos) ---
const norm = (s) =>
  (s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');

// alias: nombre de football-data (normalizado) → nombre nuestro (normalizado)
// Nuestra BD usa: Czech Republic, USA, South Korea, Ivory Coast, Cape Verde,
// Bosnia & Herzegovina, DR Congo, Turkey, Iran (ver tabla teams).
const ALIAS = {
  korearepublic: 'southkorea',
  cotedivoire: 'ivorycoast',
  czechia: 'czechrepublic',
  turkiye: 'turkey',
  unitedstates: 'usa',
  caboverde: 'capeverde',
  capeverdeislands: 'capeverde',
  congodr: 'drcongo',
  bosniaandherzegovina: 'bosniaherzegovina',
  iriran: 'iran',
};

function stageOf(fdStage) {
  const s = (fdStage ?? '').toUpperCase();
  if (s.includes('GROUP')) return 'group';
  if (s.includes('THIRD')) return 'third';
  if (s.includes('SEMI')) return 'sf';
  if (s.includes('QUARTER')) return 'qf';
  if (s.includes('16') && !s.includes('32')) return 'r16';
  if (s.includes('32')) return 'r32';
  if (s === 'FINAL' || s.includes('FINAL')) return 'final';
  return null;
}

// --- API con rate-limit (consejo de Daniel: mirar los headers) ---
async function fetchFdMatches() {
  const res = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
    headers: { 'X-Auth-Token': TOKEN },
  });
  const remaining = res.headers.get('X-Requests-Available-Minute');
  if (res.status === 429) {
    const wait = Number(res.headers.get('Retry-After') ?? 60);
    console.warn(`⏳ Rate limit: esperando ${wait}s…`);
    await new Promise((r) => setTimeout(r, wait * 1000));
    return fetchFdMatches();
  }
  if (!res.ok) throw new Error(`football-data.org HTTP ${res.status}: ${await res.text()}`);
  if (remaining !== null && Number(remaining) <= 1) {
    console.warn(`⏳ Quedan ${remaining} peticiones este minuto; el watch esperará.`);
  }
  return res.json();
}

async function cycle() {
  // 1) Nuestro estado actual
  const [{ data: teams }, { data: dbMatches }] = await Promise.all([
    svc.from('teams').select('id, name'),
    svc
      .from('matches')
      .select('id, stage, kickoff_at, status, home_score, away_score, home_team_id, away_team_id'),
  ]);
  const teamByNorm = new Map(teams.map((t) => [norm(t.name), t.id]));
  const resolveTeam = (fdName) => {
    const n = norm(fdName);
    return teamByNorm.get(n) ?? teamByNorm.get(ALIAS[n] ?? '') ?? null;
  };

  // 2) Partidos de la API (1 sola petición)
  const fd = await fetchFdMatches();
  const fdMatches = fd.matches ?? [];
  console.log(`📡 football-data.org: ${fdMatches.length} partidos recibidos.`);

  let applied = 0, live = 0, teamsSet = 0, unmatched = 0;

  for (const fm of fdMatches) {
    const stage = stageOf(fm.stage);
    if (!stage) continue;

    const homeId = resolveTeam(fm.homeTeam?.name);
    const awayId = resolveTeam(fm.awayTeam?.name);

    // 3) Emparejar con nuestro partido
    let db = null;
    let swapped = false;
    if (homeId && awayId) {
      db = dbMatches.find(
        (m) => m.stage === stage && m.home_team_id === homeId && m.away_team_id === awayId,
      );
      if (!db) {
        db = dbMatches.find(
          (m) => m.stage === stage && m.home_team_id === awayId && m.away_team_id === homeId,
        );
        if (db) swapped = true;
      }
    }
    if (!db && fm.utcDate) {
      // Cruces sin equipos en nuestra BD: emparejar por ronda + fecha/hora exacta.
      const t = new Date(fm.utcDate).getTime();
      const candidates = dbMatches.filter(
        (m) => m.stage === stage && m.kickoff_at && new Date(m.kickoff_at).getTime() === t,
      );
      if (candidates.length === 1) db = candidates[0];
    }
    if (!db) {
      if (fm.homeTeam?.name || fm.awayTeam?.name) {
        unmatched++;
        console.warn(`  ⚠️ Sin pareja: [${fm.stage}] ${fm.homeTeam?.name ?? '?'} vs ${fm.awayTeam?.name ?? '?'} (${fm.utcDate})`);
      }
      continue;
    }

    // 4) Asignar equipos a cruces recién definidos
    if (stage !== 'group' && !db.home_team_id && homeId && awayId) {
      console.log(`  🧩 Cruce definido: ${fm.homeTeam.name} vs ${fm.awayTeam.name} [${stage}]`);
      if (!DRY) {
        const { error } = await svc.rpc('system_set_teams', {
          p_match_id: db.id, p_home: homeId, p_away: awayId,
        });
        if (error) { console.error(`  ❌ ${error.message}`); continue; }
      }
      db.home_team_id = homeId;
      db.away_team_id = awayId;
      swapped = false;
      teamsSet++;
    }

    // 5) Marcadores (orientación correcta si la API los lista al revés)
    const ft = fm.score?.fullTime ?? {};
    if (ft.home === null || ft.home === undefined) continue;
    const h = swapped ? ft.away : ft.home;
    const a = swapped ? ft.home : ft.away;

    const isFinished = ['FINISHED', 'AWARDED'].includes(fm.status);
    const isLive = ['IN_PLAY', 'PAUSED'].includes(fm.status);
    if (!isFinished && !isLive) continue;

    const changed =
      db.home_score !== h || db.away_score !== a ||
      (isFinished && db.status !== 'finished') || (isLive && db.status !== 'live');
    if (!changed) continue;

    const label = `${fm.homeTeam?.name} ${ft.home}-${ft.away} ${fm.awayTeam?.name}`;
    console.log(`  ${isFinished ? '✅ FINAL' : '🔴 EN VIVO'}: ${label}`);
    if (!DRY) {
      const { error } = await svc.rpc('system_apply_result', {
        p_match_id: db.id, p_home: h, p_away: a, p_finished: isFinished,
      });
      if (error) { console.error(`  ❌ ${error.message}`); continue; }
    }
    if (isFinished) applied++; else live++;
  }

  console.log(
    `${DRY ? '🔍 (dry-run, nada escrito) ' : ''}Resumen: ${applied} finalizados aplicados · ${live} en vivo · ${teamsSet} cruces definidos · ${unmatched} sin pareja`,
  );
}

async function main() {
  do {
    try {
      await cycle();
    } catch (e) {
      console.error('❌', e.message ?? e);
      if (!WATCH) process.exit(1);
    }
    if (WATCH) {
      console.log(`💤 Próximo ciclo en ${INTERVAL_S}s (Ctrl+C para salir)…\n`);
      await new Promise((r) => setTimeout(r, INTERVAL_S * 1000));
    }
  } while (WATCH);
}

main();
