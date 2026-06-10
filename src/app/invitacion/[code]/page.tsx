import Image from 'next/image';
import Link from 'next/link';
import { acceptInvite } from '@/lib/actions/invites';
import { IconCheck, IconUsers } from '@/components/Icons';

export const metadata = { title: 'Te invitaron a una polla — Polla Mundial 2026' };

type Preview = { id: string; name: string; members: number };

// Página pública del link/QR de invitación. El código es la llave: si es
// válido se muestra la polla; unirse requiere cuenta (el flujo la pide solo).
export default async function InvitacionPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { code } = await params;
  const sp = await searchParams;
  const cleanCode = decodeURIComponent(code).toUpperCase().trim();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/get_pool_preview?p_code=${encodeURIComponent(cleanCode)}`,
    {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      cache: 'no-store',
    },
  );
  const rows: Preview[] = res.ok ? await res.json() : [];
  const pool = rows[0] ?? null;

  const joinWithCode = acceptInvite.bind(null, cleanCode);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 px-5 py-10 text-white">
      <div className="w-full max-w-md text-center">
        <Image
          src="/img/wc26-logo.svg"
          alt="Polla Mundial"
          width={40}
          height={62}
          className="mx-auto h-14 w-auto drop-shadow"
        />
        <p className="mt-3 text-lg font-black tracking-tight">Polla Mundial 2026</p>

        {pool ? (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-300">
              Te invitaron a
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight">{pool.name}</h1>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-slate-300">
              <IconUsers className="h-4 w-4" />
              {pool.members} jugador{pool.members === 1 ? '' : 'es'} ya{' '}
              {pool.members === 1 ? 'está' : 'están'} dentro
            </p>
            <p className="mt-4 inline-block rounded-xl border border-dashed border-emerald-400/40 bg-emerald-500/5 px-4 py-1.5 font-mono text-base font-bold tracking-widest text-emerald-300">
              {cleanCode}
            </p>

            {sp.error && (
              <p className="mt-4 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">
                No se pudo completar la unión. Intenta de nuevo.
              </p>
            )}

            <form action={joinWithCode} className="mt-6">
              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-black text-emerald-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400"
              >
                Unirme a la polla
              </button>
            </form>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <IconCheck className="h-3.5 w-3.5 text-emerald-400" />
              Solo necesitas una cuenta gratis — si ya la tienes, inicia sesión en el camino.
            </p>
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <h1 className="text-2xl font-black">Invitación no válida</h1>
            <p className="mt-2 text-sm text-slate-300">
              El código <span className="font-mono font-bold">{cleanCode}</span> no corresponde
              a ninguna polla. Pide a tu amigo que te reenvíe el link.
            </p>
            <Link
              href="/bienvenida"
              className="mt-6 inline-block rounded-xl border border-white/15 px-6 py-3 text-sm font-bold transition hover:bg-white/10"
            >
              Conocer Polla Mundial →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
