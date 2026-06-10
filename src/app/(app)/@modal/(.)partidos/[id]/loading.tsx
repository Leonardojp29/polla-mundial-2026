import { Modal } from '@/components/Modal';
import { MatchDetailSkeleton } from '@/components/Skeletons';

// El popup abre AL INSTANTE con esqueleto; la ficha llega por streaming.
export default function Loading() {
  return (
    <Modal>
      <MatchDetailSkeleton />
    </Modal>
  );
}
