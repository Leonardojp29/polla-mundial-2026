// Un ciclo de sincronización de resultados desde football-data.org (la misma
// lógica que scripts/sync-results.mjs, portada para correr dentro de Next en
// /api/cron/sync). Usa 1 petición al API y respeta el tier gratis (10/min).
import { createClient } from '@supabase/supabase-js';
import { normTeamName as norm, TEAM_ALIAS as ALIAS } from '@/lib/teamNames';

export type SyncSummary = {
  received: number;
  applied: number;
  live: number;
  teamsSet: number;
  unmatched: number;
};

function stageOf(fdStage: string | null | undefined): string | null {
  const s = (fdStage ?? '').toUpperCase();
  if (s.includes('GROUP')) return 'group';
  if (s.includes('THIRD')) return 'third';
  if (s.includes('SEMI')) return 'sf';
  if (s.includes('QUARTER')) return 'qf';
  if (s.includes('16') && !s.includes('32')) return 'r16';
  if (s.includes('32')) return 'r32';
  if (s.includes('FINAL')) return 'final';
  return null;
}

type FdMatch = {
  stage: string;
  status: string;
  utcDate: string | null;
  homeTeam: { name: string | null } | null;
  awayTeam: { name: string | null } | null;
  score?: { fullTime?: { home: number | null; away: number | null } };
};

export async function runSyncCycle(): Promise<SyncSummary> {
  const TOKEN = process.env.FOOTBALL_DATA_API_TOKEN;
  if (!TOKEN) throw new Error('Falta FOOTBALL_DATA_API_TOKEN');
  const svc = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  // 1) Nuestro estado actual
  const [teamsRes, matchesRes] = await Promise.all([
    svc.from('teams').select('id, name'),
    svc
      .from('matches')
      .select('id, stage, kickoff_at, status, home_score, away_score, home_team_id, away_team_id'),
  ]);
  const teams = teamsRes.data;
  const dbMatches = matchesRes.data;
  if (!teams || !dbMatches) {
    const detail = teamsRes.error?.message ?? matchesRes.error?.message ?? 'sin detalle';
    throw new Error(`No se pudo leer la BD (${detail}) — revisa SUPABASE_SERVICE_ROLE_KEY en Vercel`);
  }
  const teamByNorm = new Map(teams.map((t) => [norm(t.name), t.id]));
  const resolveTeam = (fdName: string | null | undefined): string | null => {
    const n = norm(fdName);
    return teamByNorm.get(n) ?? teamByNorm.get(ALIAS[n] ?? '') ?? null;
  };

  // 2) Partidos del API (1 sola petición; si hay 429 el cron reintenta en 10 min)
  const res = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
    headers: { 'X-Auth-Token': TOKEN },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`football-data.org HTTP ${res.status}`);
  const fdMatches: FdMatch[] = (await res.json()).matches ?? [];

  const summary: SyncSummary = {
    received: fdMatches.length,
    applied: 0,
    live: 0,
    teamsSet: 0,
    unmatched: 0,
  };

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
      const t = new Date(fm.utcDate).getTime();
      const candidates = dbMatches.filter(
        (m) => m.stage === stage && m.kickoff_at && new Date(m.kickoff_at).getTime() === t,
      );
      if (candidates.length === 1) db = candidates[0];
    }
    if (!db) {
      if (fm.homeTeam?.name || fm.awayTeam?.name) summary.unmatched++;
      continue;
    }

    // 4) Asignar equipos a cruces recién definidos
    if (stage !== 'group' && !db.home_team_id && homeId && awayId) {
      const { error } = await svc.rpc('system_set_teams', {
        p_match_id: db.id,
        p_home: homeId,
        p_away: awayId,
      });
      if (error) continue;
      db.home_team_id = homeId;
      db.away_team_id = awayId;
      swapped = false;
      summary.teamsSet++;
    }

    // 5) Marcadores (orientación correcta si la API los lista al revés)
    const ft = fm.score?.fullTime ?? { home: null, away: null };
    if (ft.home === null || ft.home === undefined) continue;
    const h = swapped ? ft.away : ft.home;
    const a = swapped ? ft.home : ft.away;

    const isFinished = ['FINISHED', 'AWARDED'].includes(fm.status);
    const isLive = ['IN_PLAY', 'PAUSED'].includes(fm.status);
    if (!isFinished && !isLive) continue;

    const changed =
      db.home_score !== h ||
      db.away_score !== a ||
      (isFinished && db.status !== 'finished') ||
      (isLive && db.status !== 'live');
    if (!changed) continue;

    const { error } = await svc.rpc('system_apply_result', {
      p_match_id: db.id,
      p_home: h,
      p_away: a,
      p_finished: isFinished,
    });
    if (error) continue;
    if (isFinished) summary.applied++;
    else summary.live++;
  }

  return summary;
}
