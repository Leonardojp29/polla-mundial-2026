// Prueba end-to-end del backend (auth + RLS + RPCs) contra Supabase local.
//   node scripts/e2e.mjs
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

const anonClient = () =>
  createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
const svc = createClient(url, service, { auth: { persistSession: false } });

let pass = 0, fail = 0;
const ok = (cond, msg) => { (cond ? pass++ : fail++); console.log(`${cond ? '✅' : '❌'} ${msg}`); };

const GLOBAL = '00000000-0000-0000-0000-000000000001';
const rnd = Math.random().toString(36).slice(2, 8);

async function main() {
  // --- Usuario 1 se registra ---
  const a = anonClient();
  const s1 = await a.auth.signUp({
    email: `ana_${rnd}@test.local`,
    password: 'secret123',
    options: { data: { first_name: 'Ana', last_name: 'Pérez', username: `ana_${rnd}`, country: 'Colombia' } },
  });
  ok(!s1.error && s1.data.session, 'Usuario 1 se registra e inicia sesión');
  const uid1 = s1.data.user.id;

  // --- Trigger: perfil creado con datos profesionales ---
  const { data: prof } = await svc.from('profiles').select('*').eq('id', uid1).single();
  ok(prof?.first_name === 'Ana' && prof?.country === 'Colombia', 'Perfil creado (nombre + país)');

  // --- Trigger: inscripción automática en la Polla Global ---
  const { data: gm } = await svc
    .from('memberships').select('*').eq('user_id', uid1).eq('pool_id', GLOBAL).maybeSingle();
  ok(!!gm, 'Inscrito automáticamente en la Polla Global');

  // --- Crear polla privada ---
  const cp = await a.rpc('create_pool', { p_name: 'Polla E2E' });
  const pool = Array.isArray(cp.data) ? cp.data[0] : cp.data;
  ok(!cp.error && pool?.code?.startsWith('WC26-'), `Crea polla privada con código ${pool?.code}`);

  // --- Usuario 2 se registra y se une con el código ---
  const b = anonClient();
  const s2 = await b.auth.signUp({
    email: `leo_${rnd}@test.local`, password: 'secret123',
    options: { data: { first_name: 'Leo', username: `leo_${rnd}` } },
  });
  const uid2 = s2.data.user.id;
  const jp = await b.rpc('join_pool_by_code', { p_code: pool.code.toLowerCase() });
  ok(!jp.error && jp.data === pool.id, 'Usuario 2 se une con el código (case-insensitive)');

  // --- Código inválido es rechazado ---
  const bad = await b.rpc('join_pool_by_code', { p_code: 'WC26-ZZZZ' });
  ok(!!bad.error, 'Código inválido es rechazado');

  // --- Ranking incluye a los 2 miembros ---
  const lb = await a.rpc('get_leaderboard', { p_pool_id: pool.id });
  ok(!lb.error && lb.data?.length === 2, 'Ranking lista a los 2 jugadores');

  // --- RLS: usuario 2 NO puede leer el perfil del usuario 1 ---
  const leak = await b.from('profiles').select('*').eq('id', uid1);
  ok(!leak.error && (leak.data?.length ?? 0) === 0, 'RLS: no se filtran perfiles ajenos');

  // --- RLS: usuario 3 (no miembro) NO ve la polla privada ---
  const c = anonClient();
  await c.auth.signUp({ email: `ext_${rnd}@test.local`, password: 'secret123', options: { data: { first_name: 'Ext' } } });
  const hidden = await c.from('pools').select('*').eq('id', pool.id);
  ok(!hidden.error && (hidden.data?.length ?? 0) === 0, 'RLS: la polla privada no es visible para no-miembros');

  // --- Todos ven la polla global ---
  const globalVisible = await c.from('pools').select('*').eq('id', GLOBAL);
  ok((globalVisible.data?.length ?? 0) === 1, 'La Polla Global es visible para todos');

  // ======== Fase 3: resultados (admin) y cálculo de puntos ========
  await svc.from('profiles').update({ role: 'admin' }).eq('id', uid1);

  // Último partido de grupos (en el futuro): ana exacto 2-1, leo falla 0-1.
  const { data: target } = await svc
    .from('matches').select('id').eq('stage', 'group')
    .order('kickoff_at', { ascending: false }).limit(1).single();
  await a.from('predictions').insert({ pool_id: pool.id, user_id: uid1, match_id: target.id, pred_home_score: 2, pred_away_score: 1 });
  await b.from('predictions').insert({ pool_id: pool.id, user_id: uid2, match_id: target.id, pred_home_score: 0, pred_away_score: 1 });

  const noAdmin = await b.rpc('set_match_result', { p_match_id: target.id, p_home: 2, p_away: 1 });
  ok(!!noAdmin.error, 'Un no-admin NO puede cargar resultados');

  const sr = await a.rpc('set_match_result', { p_match_id: target.id, p_home: 2, p_away: 1 });
  ok(!sr.error, 'Admin carga el resultado 2-1');

  const { data: p1 } = await svc.from('predictions').select('points_awarded')
    .eq('pool_id', pool.id).eq('user_id', uid1).eq('match_id', target.id).single();
  ok(p1?.points_awarded === 5, `Marcador exacto otorga 5 pts (obtuvo ${p1?.points_awarded})`);

  const { data: p2 } = await svc.from('predictions').select('points_awarded')
    .eq('pool_id', pool.id).eq('user_id', uid2).eq('match_id', target.id).single();
  ok(p2?.points_awarded === 0, `Pronóstico fallido otorga 0 pts (obtuvo ${p2?.points_awarded})`);

  const lb2 = await a.rpc('get_leaderboard', { p_pool_id: pool.id });
  ok(lb2.data?.[0]?.user_id === uid1 && Number(lb2.data?.[0]?.points) === 5, 'El ranking refleja los puntos');

  const cr = await a.rpc('clear_match_result', { p_match_id: target.id });
  const { data: reopened } = await svc.from('matches').select('status, home_score').eq('id', target.id).single();
  ok(!cr.error && reopened?.status === 'scheduled' && reopened?.home_score === null,
     'clear_match_result reabre el partido y borra puntos');

  // ======== Fase 4: cruces + pronóstico maestro ========
  const { data: finalMatch } = await svc
    .from('matches').select('id').eq('stage', 'final').single();

  const st = await a.rpc('set_match_teams', { p_match_id: finalMatch.id, p_home: 'argentina', p_away: 'france' });
  ok(!st.error, 'Admin asigna equipos a un cruce (final: Argentina vs Francia)');

  const spIns = await a.from('special_predictions').upsert({
    pool_id: pool.id, user_id: uid1,
    champion_team_id: 'argentina', runner_up_team_id: 'france',
    semifinalist_team_ids: ['argentina', 'france', 'brazil', 'spain'],
    top_scorer_name: 'Lionel Messi',
    group_winners: { A: { first: 'mexico', second: 'south-korea' } },
  }, { onConflict: 'pool_id,user_id' });
  ok(!spIns.error, 'Guarda pronóstico maestro antes del cierre');

  await a.rpc('set_match_result', { p_match_id: finalMatch.id, p_home: 2, p_away: 1 });
  const rs = await a.rpc('recalc_special_points', { p_top_scorer: null });
  ok(!rs.error, 'recalc_special_points corre sin error');

  const { data: spPts } = await svc.from('special_predictions')
    .select('points_awarded').eq('pool_id', pool.id).eq('user_id', uid1).single();
  ok(spPts?.points_awarded === 40, `Campeón (25) + finalista (15) = 40 pts (obtuvo ${spPts?.points_awarded})`);

  // Revertir la final y recalcular en limpio.
  await a.rpc('clear_match_result', { p_match_id: finalMatch.id });
  await svc.from('matches').update({ home_team_id: null, away_team_id: null }).eq('id', finalMatch.id);
  await a.rpc('recalc_special_points', { p_top_scorer: null });
  const { data: m3 } = await svc.from('matches').select('home_team_id, status').eq('id', finalMatch.id).single();
  ok(m3?.home_team_id === null && m3?.status === 'scheduled', 'La final quedó revertida (sin equipos ni resultado)');

  // ======== Limpieza: borrar polla y usuarios de prueba ========
  await svc.from('pools').delete().eq('id', pool.id);
  const { data: list } = await svc.auth.admin.listUsers({ perPage: 200 });
  let cleaned = 0;
  for (const u of list.users) {
    if (u.email?.endsWith('@test.local')) {
      await svc.auth.admin.deleteUser(u.id);
      cleaned++;
    }
  }
  console.log(`🧹 Limpieza: ${cleaned} usuarios de prueba eliminados`);

  console.log(`\n${fail === 0 ? '🎉' : '⚠️'}  ${pass} ok, ${fail} fallos`);
  process.exit(fail === 0 ? 0 : 1);
}
main().catch((e) => { console.error('❌ Excepción:', e.message || e); process.exit(1); });
