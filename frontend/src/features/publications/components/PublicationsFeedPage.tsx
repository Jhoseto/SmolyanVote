"use client";

import type { ReactNode } from "react";
import { Container, EmptyState, ErrorState, LogoLoader } from "@/shared/ui";
import { useInfiniteScrollSentinel } from "@/shared/hooks/useInfiniteScrollSentinel";
import { usePublicationsFilters } from "../hooks/usePublicationsFilters";
import { usePublicationsFeed } from "../hooks/usePublicationsFeed";
import { usePublicationDetailModal } from "../hooks/usePublicationDetailModal";
import { PublicationsFilters } from "./PublicationsFilters";
import { PublicationCard } from "./PublicationCard";
import { PublicationComposer } from "./PublicationComposer";
import { PublicationDetailModal } from "./PublicationDetailModal";
import { PublicationsSidebar } from "./PublicationsSidebar";
import type { Publication } from "../types";

interface PublicationsFeedPageProps {
  /** "Следвай автора" + "Докладвай" per card/modal — composed at the `app/` layer (features never import features). */
  renderFollowSlot?: (publication: Publication) => ReactNode;
  renderReportSlot?: (publication: Publication) => ReactNode;
  renderCommentsSlot?: (id: number) => ReactNode;
  /** "Следвай" в "top-authors" widget и в "кой реагирал" модала — по потребител, не по публикация. */
  renderAuthorFollowSlot?: (userId: number) => ReactNode;
}

export function PublicationsFeedPage({
  renderFollowSlot,
  renderReportSlot,
  renderCommentsSlot,
  renderAuthorFollowSlot,
}: PublicationsFeedPageProps = {}) {
  const [filters, setFilters] = usePublicationsFilters();
  const { openId, open: openDetail, close: closeDetail } = usePublicationDetailModal();

  const feedFilters = {
    search: filters.search || undefined,
    category: filters.category ?? undefined,
    time: filters.time ?? undefined,
    sort: filters.sort,
    userIds: filters.userIds.length > 0 ? filters.userIds.join(",") : undefined,
  };

  const { data, isPending, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    usePublicationsFeed(feedFilters);

  const sentinelRef = useInfiniteScrollSentinel({
    onIntersect: fetchNextPage,
    enabled: !!hasNextPage && !isFetchingNextPage,
  });

  const publications = data?.pages.flatMap((p) => p.content) ?? [];
  const totalElements = data?.pages[0]?.totalElements ?? 0;

  return (
    <Container className="grid grid-cols-1 gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-[color:var(--color-text-heading)] sm:text-3xl">Публикации</h1>
          <p className="text-[color:var(--color-text-secondary)]">
            Новини, инициативи и мнения от жителите на Смолян.
          </p>
        </div>

        <PublicationComposer />

        <PublicationsFilters />

        {isPending && (
          <div className="flex min-h-[240px] items-center justify-center py-12">
            <LogoLoader size="lg" label="Зареждане на публикации…" />
          </div>
        )}

        {isError && <ErrorState description="Публикациите не можаха да се заредят." onRetry={() => refetch()} />}

        {data && publications.length === 0 && (
          <EmptyState
            icon="bi-file-text"
            title="Няма намерени публикации"
            description="Опитайте да промените филтрите или търсенето."
          />
        )}

        {data && publications.length > 0 && (
          <>
            <p className="text-sm text-[color:var(--color-text-muted)]">
              Намерени {totalElements} {totalElements === 1 ? "публикация" : "публикации"}
            </p>
            <div className="flex flex-col gap-5">
              {publications.map((publication) => (
                <PublicationCard
                  key={publication.id}
                  publication={publication}
                  onOpenDetail={openDetail}
                  followSlot={renderFollowSlot?.(publication)}
                  reportSlot={renderReportSlot?.(publication)}
                />
              ))}
            </div>

            <div ref={sentinelRef} className="flex justify-center py-4">
              {isFetchingNextPage && <LogoLoader size="sm" label="Зареждане…" />}
            </div>
          </>
        )}
      </div>

      <aside>
        <PublicationsSidebar
          onOpenPost={openDetail}
          onTrendingClick={(topic) => setFilters({ search: topic })}
          renderAuthorFollowSlot={renderAuthorFollowSlot}
        />
      </aside>

      <PublicationDetailModal
        id={openId}
        onClose={closeDetail}
        followSlot={renderFollowSlot}
        reportSlot={renderReportSlot}
        commentsSlot={renderCommentsSlot}
        reactionUserFollowSlot={renderAuthorFollowSlot}
      />
    </Container>
  );
}
