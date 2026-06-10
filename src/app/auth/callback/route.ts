import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Callback de OAuth (Google): intercambia el código por la sesión.
// Si el perfil está incompleto (primer login), pasa por el onboarding.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
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
