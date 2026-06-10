// Siembra equipos (48) y partidos (104) del Mundial 2026 desde OpenFootball.
// Fuente pública sin API key. Idempotente: usa upsert por clave estable.
//
//   node scripts/seed.mjs
//
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const SOURCE = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json';

// --- cargar .env.local (sin dependencias) ---
function loadEnv() {
  try {
    const txt = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
    for (const line of txt.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch { /* sin archivo: usar process.env */ }
}
loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error('Falta SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }

const db = createClient(url, key, { auth: { persistSession: false } });

// --- banderas ISO2 por nombre normalizado (los 48 del Mundial 2026) ---
const FLAGS = {
  mexico: 'MX', southafrica: 'ZA', southkorea: 'KR', korearepublic: 'KR', korea: 'KR',
  czechia: 'CZ', czechrepublic: 'CZ', canada: 'CA', bosniaandherzegovina: 'BA', bosnia: 'BA',
  bosniaherzegovina: 'BA', qatar: 'QA', switzerland: 'CH', brazil: 'BR', morocco: 'MA', haiti: 'HT',
  scotland: 'GB-SCT', unitedstates: 'US', usa: 'US', paraguay: 'PY', australia: 'AU',
  turkey: 'TR', turkiye: 'TR', germany: 'DE', curacao: 'CW', ivorycoast: 'CI', cotedivoire: 'CI',
  ecuador: 'EC', netherlands: 'NL', japan: 'JP', sweden: 'SE', tunisia: 'TN',
  belgium: 'BE', egypt: 'EG', iran: 'IR', iriran: 'IR', newzealand: 'NZ', spain: 'ES',
  capeverde: 'CV', caboverde: 'CV', saudiarabia: 'SA', uruguay: 'UY', france: 'FR',
  senegal: 'SN', iraq: 'IQ', norway: 'NO', argentina: 'AR', algeria: 'DZ',
  austria: 'AT', jordan: 'JO', portugal: 'PT', drcongo: 'CD', congodr: 'CD',
  democraticrepublicofcongo: 'CD', uzbekistan: 'UZ', colombia: 'CO', england: 'GB-ENG',
  croatia: 'HR', ghana: 'GH', panama: 'PA',
};

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function stageOf(round, group) {
  const r = (round || '').toLowerCase();
  if (group || r.includes('matchday') || r.includes('group')) return 'group';
  if (r.includes('round of 32') || r.includes('1/16')) return 'r32';
  if (r.includes('round of 16') || r.includes('1/8')) return 'r16';
  if (r.includes('quarter') || r.includes('1/4')) return 'qf';
  if (r.includes('semi')) return 'sf';
  if (r.includes('third') || r.includes('3rd')) return 'third';
  if (r.includes('final')) return 'final';
  return 'group';
}

function parseKickoff(date, time) {
  if (!date) return null;
  if (!time) return `${date}T00:00:00+00:00`;
  const t = time.match(/(\d{1,2}):(\d{2})/);
  const hh = t ? t[1].padStart(2, '0') : '00';
  const mm = t ? t[2] : '00';
  const off = time.match(/UTC\s*([+-]\d{1,2})/i);
  let offset = '+00:00';
  if (off) {
    const n = parseInt(off[1], 10);
    offset = `${n < 0 ? '-' : '+'}${String(Math.abs(n)).padStart(2, '0')}:00`;
  }
  return `${date}T${hh}:${mm}:00${offset}`;
}

const groupLetter = (g) => (g ? (g.match(/group\s*([a-l])/i)?.[1]?.toUpperCase() ?? null) : null);

async function main() {
  console.log('Descargando fixture de OpenFootball…');
  const res = await fetch(SOURCE);
  if (!res.ok) throw new Error(`OpenFootball HTTP ${res.status}`);
  const data = await res.json();
  const matches = data.matches || [];
  console.log(`  ${matches.length} partidos en la fuente.`);

  // --- equipos: salen de los partidos de fase de grupos ---
  const teamMap = new Map(); // slug -> name
  for (const m of matches) {
    if (stageOf(m.round, m.group) !== 'group') continue;
    for (const name of [m.team1, m.team2]) {
      if (name) teamMap.set(slug(name), name);
    }
  }
  const teams = [...teamMap.entries()].map(([id, name]) => ({
    id, name, flag_code: FLAGS[norm(name)] ?? null, group_letter: null,
  }));
  // asignar grupo a cada equipo
  for (const m of matches) {
    const g = groupLetter(m.group);
    if (!g) continue;
    for (const name of [m.team1, m.team2]) {
      const t = teams.find((x) => x.id === slug(name));
      if (t && !t.group_letter) t.group_letter = g;
    }
  }
  console.log(`  ${teams.length} equipos detectados.`);

  // --- partidos ---
  const rows = matches.map((m) => {
    const stage = stageOf(m.round, m.group);
    const isGroup = stage === 'group';
    const homeId = isGroup ? slug(m.team1) : (teamMap.has(slug(m.team1 || '')) ? slug(m.team1) : null);
    const awayId = isGroup ? slug(m.team2) : (teamMap.has(slug(m.team2 || '')) ? slug(m.team2) : null);
    return {
      ext_key: `${m.date}|${m.team1}|${m.team2}`,
      stage,
      group_letter: groupLetter(m.group),
      home_team_id: homeId,
      away_team_id: awayId,
      home_label: homeId ? null : (m.team1 || null),
      away_label: awayId ? null : (m.team2 || null),
      kickoff_at: parseKickoff(m.date, m.time),
      venue: m.ground || null,
      status: 'scheduled',
    };
  });

  console.log('Insertando equipos…');
  let r = await db.from('teams').upsert(teams, { onConflict: 'id' });
  if (r.error) throw r.error;

  console.log('Insertando partidos…');
  r = await db.from('matches').upsert(rows, { onConflict: 'ext_key' });
  if (r.error) throw r.error;

  const { count: tc } = await db.from('teams').select('*', { count: 'exact', head: true });
  const { count: mc } = await db.from('matches').select('*', { count: 'exact', head: true });
  console.log(`✅ Listo. teams=${tc}  matches=${mc}`);
}

main().catch((e) => { console.error('❌', e.message || e); process.exit(1); });
