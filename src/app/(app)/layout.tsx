import Link from 'next/link';
import Image from 'next/image';
import { getProfile } from '@/lib/data';
import { signOut } from '@/lib/actions/auth';
import { Avatar } from '@/components/Avatar';
import { IconSettings } from '@/components/Icons';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  const greeting = profile?.username || profile?.first_name || 'jugador';
  const isAdmin = profile?.role === 'admin';

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/img/wc26-logo.svg"
              alt="Copa Mundial FIFA 2026"
              width={26}
              height={40}
              priority
              className="h-9 w-auto"
            />
            <span className="flex items-baseline gap-2">
              <span className="text-lg font-black tracking-tight">Polla Mundial</span>
              <span className="hidden text-xs font-medium text-slate-400 sm:inline">
                Mundial 2026
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/equipos"
              className="hidden rounded-lg px-2.5 py-1.5 font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 sm:inline"
            >
              Selecciones
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 rounded-lg bg-amber-100 px-3 py-1.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-200"
              >
                <IconSettings className="h-4 w-4" /> Admin
              </Link>
            )}
            <Link
              href="/perfil"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-800"
            >
              <Avatar
                name={profile?.first_name || greeting}
                url={profile?.avatar_url}
                className="h-6 w-6 text-[9px]"
              />
              <span className="max-w-[8rem] truncate font-medium">{greeting}</span>
              <span className="hidden text-xs font-medium text-emerald-700 sm:inline">
                · Ver perfil
              </span>
            </Link>
            <form action={signOut}>
              <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100">
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>

      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        Polla Mundial · Mundial 2026 · 48 selecciones · 104 partidos
      </footer>
    </div>
  );
}
