import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Rutas públicas (sin sesión). El resto exige estar logueado.
// /api/cron se protege solo (CRON_SECRET). /api/ics son feeds de calendario:
// los lee el teléfono/Google sin cookies (datos públicos del torneo).
const PUBLIC_PATHS = [
  '/bienvenida',
  '/login',
  '/registro',
  '/recuperar',
  '/auth',
  '/api/cron',
  '/api/ics',
];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANTE: no metas lógica entre createServerClient y getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + '/'));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    // La portada para visitantes es la landing; el resto pide login.
    url.pathname = path === '/' ? '/bienvenida' : '/login';
    return NextResponse.redirect(url);
  }

  // Un usuario logueado no necesita la landing.
  if (user && path === '/bienvenida') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
