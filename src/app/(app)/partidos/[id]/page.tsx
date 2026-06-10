import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MatchDetail } from '@/components/MatchDetail';

// Versión página completa (compartir link / recargar; en navegación interna
// la misma ruta se intercepta y sale como popup).
export default async function PartidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const matchId = Number(id);
  if (!Number.isInteger(matchId)) notFound();
  return (
    <>
      <Link href="/#calendario" className="text-sm text-slate-500 hover:underline">
        ← Calendario
      </Link>
      <div className="mx-auto mt-3 max-w-3xl">
        <MatchDetail id={matchId} />
      </div>
    </>
  );
}
