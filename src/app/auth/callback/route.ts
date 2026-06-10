import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Callback de auth: intercambia el código por la sesión. Lo usan el login con
// Google y el enlace de recuperar contraseña (?next=/restablecer).
// Si el perfil está incompleto (primer login con Google), pasa por el onboarding.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next');
  // Solo rutas internas (evita open redirect).
  const next = nextParam?.startsWith('/') && !nextParam.startsWith('//') ? nextParam : null;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (next) return NextResponse.redirect(`${origin}${next}`);
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, country')
        .eq('id', data.user.id)
        .single();
      if (!profile?.username || !profile?.country) {
        return NextResponse.redirect(`${origin}/completar-perfil`);
      }
      return NextResponse.redirect(`${origin}/`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
