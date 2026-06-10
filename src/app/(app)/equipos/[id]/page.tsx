import Link from 'next/link';
import { TeamProfile } from '@/components/TeamProfile';

// Versión página completa (al compartir el link o recargar; desde la Home la
// misma ruta se intercepta y sale como popup).
export default async function EquipoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Link href="/" className="text-sm text-slate-500 hover:underline">
        ← Inicio
      </Link>
      <div className="mt-3">
        <TeamProfile id={id} />
      </div>
    </>
  );
}
