import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { runSyncCycle } from '@/lib/sync';

// Sincronización de resultados invocada por un cron externo (cron-job.org)
// cada 10 minutos. Protegida con CRON_SECRET — no usa sesión de usuario.
//   curl -H "Authorization: Bearer $CRON_SECRET" https://<app>/api/cron/sync
export const maxDuration = 60;

export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const summary = await runSyncCycle();
    // Si algo cambió, invalida el caché de datos públicos: los marcadores
    // se ven al instante en todas las vistas.
    if (summary.applied > 0 || summary.live > 0 || summary.teamsSet > 0) {
      revalidateTag('public-data', 'max');
    }
    return NextResponse.json({ ok: true, ...summary });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
