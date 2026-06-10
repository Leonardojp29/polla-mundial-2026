import { MatchDetailSkeleton } from '@/components/Skeletons';

export default function Loading() {
  return (
    <div className="mx-auto mt-8 max-w-3xl">
      <MatchDetailSkeleton />
    </div>
  );
}
