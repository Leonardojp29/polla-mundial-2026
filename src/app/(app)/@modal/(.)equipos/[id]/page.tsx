import { Modal } from '@/components/Modal';
import { TeamProfile } from '@/components/TeamProfile';

// /equipos/[id] interceptada: al navegar desde la Home sale como popup.
export default async function EquipoModalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Modal>
      <TeamProfile id={id} />
    </Modal>
  );
}
