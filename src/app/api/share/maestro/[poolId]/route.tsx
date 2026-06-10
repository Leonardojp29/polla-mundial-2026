import { ImageResponse } from 'next/og';
import { createClient } from '@/lib/supabase/server';

// Tarjeta PNG (1080×1080) del pronóstico maestro del usuario, para compartir
// por WhatsApp. Solo el dueño puede generarla (usa su sesión).
export async function GET(
  request: Request,
  { params }: { params: Promise<{ poolId: string }> },
) {
  const { poolId } = await params;
  const { origin } = new URL(request.url);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response('No autorizado', { status: 401 });

  const [{ data: special }, { data: profile }, { data: pool }, { data: teams }] =
    await Promise.all([
      supabase
        .from('special_predictions')
        .select('champion_team_id, runner_up_team_id, semifinalist_team_ids, top_scorer_name')
        .eq('pool_id', poolId)
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase.from('profiles').select('first_name, username').eq('id', user.id).single(),
      supabase.from('pools').select('name').eq('id', poolId).single(),
      supabase.from('teams').select('id, name, flag_code'),
    ]);

  if (!special?.champion_team_id) {
    return new Response('Aún no tienes pronóstico maestro en esta polla', { status: 404 });
  }

  const teamMap = new Map((teams ?? []).map((t) => [t.id, t]));
  const flag = (teamId: string | null | undefined, size: number) => {
    const code = teamId ? teamMap.get(teamId)?.flag_code : null;
    if (!code) return null;
    return (
      // eslint-disable-next-line @next/next/no-img-element -- satori usa <img> plano
      <img
        src={`${origin}/flags/${code.toLowerCase()}.png`}
        width={size}
        height={Math.round(size * 0.75)}
        style={{ borderRadius: 8, objectFit: 'cover' }}
        alt=""
      />
    );
  };
  const name = profile?.first_name || profile?.username || 'Jugador';
  const champion = teamMap.get(special.champion_team_id);
  const runnerUp = special.runner_up_team_id ? teamMap.get(special.runner_up_team_id) : null;
  const semis = (special.semifinalist_team_ids ?? []).filter(Boolean) as string[];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#064e3b',
          backgroundImage: 'linear-gradient(160deg, #064e3b 0%, #065f46 55%, #047857 100%)',
          color: 'white',
          padding: 64,
          fontSize: 28,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: 26, letterSpacing: 8, color: '#6ee7b7', fontWeight: 700 }}>
            POLLA MUNDIAL 2026
          </div>
          <div style={{ fontSize: 44, fontWeight: 700, marginTop: 8 }}>
            El pronóstico de {name}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 30, letterSpacing: 6, color: '#6ee7b7', fontWeight: 700 }}>
            CAMPEÓN
          </div>
          {flag(special.champion_team_id, 220)}
          <div style={{ fontSize: 64, fontWeight: 700 }}>{champion?.name ?? '—'}</div>
          {runnerUp && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6 }}>
              <div style={{ fontSize: 28, color: '#a7f3d0' }}>Finalista:</div>
              {flag(special.runner_up_team_id, 56)}
              <div style={{ fontSize: 32, fontWeight: 700 }}>{runnerUp.name}</div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          {semis.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 26, color: '#a7f3d0' }}>Semifinalistas:</div>
              {semis.map((id) => (
                <div key={id} style={{ display: 'flex' }}>
                  {flag(id, 64)}
                </div>
              ))}
            </div>
          )}
          {special.top_scorer_name && (
            <div style={{ display: 'flex', gap: 10, fontSize: 28 }}>
              <div style={{ color: '#a7f3d0' }}>Goleador:</div>
              <div style={{ fontWeight: 700 }}>{special.top_scorer_name}</div>
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            fontSize: 24,
            color: '#a7f3d0',
          }}
        >
          <div>{pool?.name ?? 'Polla Mundial'}</div>
          <div>¿Y tú, ya jugaste?</div>
        </div>
      </div>
    ),
    { width: 1080, height: 1080 },
  );
}
