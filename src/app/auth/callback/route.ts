import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { INVITE_COOKIE } from '@/lib/invite';
import { ensureEnvAdmin } from '@/lib/adminBootstrap';

// Callback de auth: intercambia el código por la sesión. Lo usan el login con
// Google y el enlace de recuperar contraseña (?next=/restablecer). El perfil
// se autocompleta en la BD (username nombre.apellido), así que Google entra
// directo; si había una invitación pendiente, une a la polla y lleva allí.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next');
  // Solo rutas internas (evita open redirect).
  const next = nextParam?.startsWith('/') && !nextParam.startsWith('//') ? nextParam : null;
  const inviteCode = request.cookies.get(INVITE_COOKIE)?.value ?? null;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      await ensureEnvAdmin(data.user?.id, data.user?.email);
      let dest = next ?? '/';
      if (!next && inviteCode) {
        const { data: poolId } = await supabase.rpc('join_pool_by_code', {
          p_code: inviteCode,
        });
        if (poolId) dest = `/pollas/${poolId}/predicciones`;
      }
      const res = NextResponse.redirect(`${origin}${dest}`);
      if (inviteCode) res.cookies.delete(INVITE_COOKIE);
      return res;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
