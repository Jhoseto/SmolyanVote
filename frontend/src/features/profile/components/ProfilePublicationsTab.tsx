"use client";

import { EmptyState, ErrorState, Skeleton } from "@/shared/ui";
import { useInfiniteScrollSentinel } from "@/shared/hooks/useInfiniteScrollSentinel";
import { useProfilePublications } from "../hooks/useProfilePublications";
import { ProfilePublicationCard } from "./ProfilePublicationCard";

export function ProfilePublicationsTab({ authorId }: { authorId: number }) {
  const { data, isPending, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useProfilePublications(authorId);

  const sentinelRef = useInfiniteScrollSentinel({
    onIntersect: fetchNextPage,
    enabled: !!hasNextPage && !isFetchingNextPage,
  });

  if (isPending) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-56 w-full rounded-[var(--radius-lg)]" />
        ))}
      </div>
    );
  }

  if (isError) return <ErrorState description="Публикациите не можаха да се заредят." onRetry={() => refetch()} />;

  const publications = data?.pages.flatMap((p) => p.content) ?? [];
  if (publications.length === 0) return <EmptyState icon="bi-newspaper" title="Няма създадени публикации" />;

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {publications.map((publication) => (
          <ProfilePublicationCard key={publication.id} publication={publication} />
        ))}
      </div>
      <div ref={sentinelRef} className="h-1" />
      {isFetchingNextPage && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-[var(--radius-lg)]" />
          ))}
        </div>
      )}
    </div>
  );
}
