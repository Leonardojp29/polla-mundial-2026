import { notFound } from 'next/navigation';
import { Modal } from '@/components/Modal';
import { MatchDetail } from '@/components/MatchDetail';

// /partidos/[id] interceptada: al navegar dentro de la app sale como popup.
export default async function PartidoModalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const matchId = Number(id);
  if (!Number.isInteger(matchId)) notFound();
  return (
    <Modal>
      <MatchDetail id={matchId} />
    </Modal>
  );
}
