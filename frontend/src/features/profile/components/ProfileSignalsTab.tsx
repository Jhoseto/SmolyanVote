"use client";

import { EmptyState, ErrorState, Skeleton } from "@/shared/ui";
import { useProfileSignals } from "../hooks/useProfileSignals";
import { ProfileSignalCard } from "./ProfileSignalCard";

export function ProfileSignalsTab({ username }: { username: string }) {
  const { data, isPending, isError, refetch } = useProfileSignals(username);

  if (isPending) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-56 w-full rounded-[var(--radius-lg)]" />
        ))}
      </div>
    );
  }

  if (isError) return <ErrorState description="Сигналите не можаха да се заредят." onRetry={() => refetch()} />;

  if (!data?.length) return <EmptyState icon="bi-geo-alt" title="Няма подадени сигнали" />;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((signal) => (
        <ProfileSignalCard key={signal.id} signal={signal} />
      ))}
    </div>
  );
}
