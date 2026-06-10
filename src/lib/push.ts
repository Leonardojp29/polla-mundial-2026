// Envío de recordatorios Web Push desde el cron: "X vs Y cierra en ~2 h".
// Ventana [110, 120) minutos antes del kickoff: con el cron cada 10 minutos,
// cada partido cae en exactamente un ciclo (sin duplicados).
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';
import { esTeamName } from '@/lib/teamNames';

export async function sendClosingNotifications(): Promise<number> {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return 0;
  webpush.setVapidDetails('mailto:leojuradop@gmail.com', pub, priv);

  const svc = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const from = new Date(Date.now() + 110 * 60_000).toISOString();
  const to = new Date(Date.now() + 120 * 60_000).toISOString();
  const { data: matches } = await svc
    .from('matches')
    .select(
      'id, kickoff_at, home:teams!matches_home_team_id_fkey(name), away:teams!matches_away_team_id_fkey(name)',
    )
    .eq('status', 'scheduled')
    .gte('kickoff_at', from)
    .lt('kickoff_at', to);
  if (!matches || matches.length === 0) return 0;

  const { data: subs } = await svc
    .from('push_subscriptions')
    .select('endpoint, user_id, p256dh, auth');
  if (!subs || subs.length === 0) return 0;

  let sent = 0;
  for (const m of matches) {
    const home = esTeamName((m.home as unknown as { name: string } | null)?.name ?? 'Local');
    const away = esTeamName((m.away as unknown as { name: string } | null)?.name ?? 'Visita');

    // Quiénes ya pronosticaron este partido (en cualquier polla).
    const { data: preds } = await svc
      .from('predictions')
      .select('user_id')
      .eq('match_id', m.id);
    const predicted = new Set((preds ?? []).map((p) => p.user_id));

    const payload = JSON.stringify({
      title: `${home} vs ${away} cierra pronto`,
      body: 'Te quedan ~2 horas para dejar tu pronóstico.',
      url: `/partidos/${m.id}`,
    });

    for (const s of subs) {
      if (predicted.has(s.user_id)) continue;
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        );
        sent++;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        // Suscripción muerta: se limpia sola.
        if (status === 404 || status === 410) {
          await svc.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
        }
      }
    }
  }
  return sent;
}
