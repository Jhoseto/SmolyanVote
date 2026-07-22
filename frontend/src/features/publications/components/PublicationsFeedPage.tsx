"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { parseAsBoolean, useQueryState } from "nuqs";
import { useQueryClient } from "@tanstack/react-query";
import { EmptyState, ErrorState, LogoLoader } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useAuth } from "@/shared/lib/authContext";
import { useInfiniteScrollSentinel } from "@/shared/hooks/useInfiniteScrollSentinel";
import { usePublicationsFilters } from "../hooks/usePublicationsFilters";
import type { PublicationsFeedMode } from "../hooks/usePublicationsFilters";
import { usePublicationsFeed } from "../hooks/usePublicationsFeed";
import { usePublicationDetailModal } from "../hooks/usePublicationDetailModal";
import { useFollowingAuthorIds } from "../hooks/useFollowingAuthorIds";
import { useNewPublicationsPill } from "../hooks/useNewPublicationsPill";
import { PublicationsFilters } from "./PublicationsFilters";
import { PublicationsFeedTabs } from "./PublicationsFeedTabs";
import { PublicationsUnifiedSearch } from "./PublicationsUnifiedSearch";
import { PublicationsLeftRail } from "./PublicationsLeftRail";
import { PublicationCard } from "./PublicationCard";
import { PublicationComposer } from "./PublicationComposer";
import { PublicationDetailModal } from "./PublicationDetailModal";
import { PublicationsSidebar } from "./PublicationsSidebar";
import type { Publication } from "../types";

interface PublicationsFeedPageProps {
  renderFollowSlot?: (publication: Publication) => ReactNode;
  renderReportSlot?: (publication: Publication) => ReactNode;
  renderCommentsSlot?: (id: number) => ReactNode;
  renderAuthorFollowSlot?: (userId: number) => ReactNode;
  renderAuthorMessageSlot?: (userId: number) => ReactNode;
}

/** Side rails stay pinned; only the center feed scrolls with the page. */
const SIDE_RAIL =
  "xl:sticky xl:top-[calc(var(--navbar-height)+12px)] xl:self-start xl:max-h-[calc(100dvh-var(--navbar-height)-24px)] xl:overflow-y-auto xl:overscroll-contain";

export function PublicationsFeedPage({
  renderFollowSlot,
  renderReportSlot,
  renderCommentsSlot,
  renderAuthorFollowSlot,
  renderAuthorMessageSlot,
}: PublicationsFeedPageProps = {}) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = usePublicationsFilters();
  const [compose, setCompose] = useQueryState("compose", parseAsBoolean.withDefault(false));
  const { openId, focusComments, open: openDetail, close: closeDetail } = usePublicationDetailModal();

  const followingMode = filters.feed === "following";
  const followingQuery = useFollowingAuthorIds(followingMode && isAuthenticated);
  const followingIds = followingQuery.data ?? [];

  const userIdsParam = followingMode
    ? followingIds.length > 0
      ? followingIds.join(",")
      : "-1"
    : filters.userIds.length > 0
      ? filters.userIds.join(",")
      : undefined;

  const feedFilters = {
    search: filters.search || undefined,
    category: filters.category ?? undefined,
    time: filters.time ?? undefined,
    sort: filters.sort,
    userIds: userIdsParam,
    author: filters.author === "me" ? ("me" as const) : undefined,
  };

  const feedEnabled =
    !followingMode || (isAuthenticated && !followingQuery.isPending && followingIds.length > 0);

  const { data, isPending, isFetching, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    usePublicationsFeed(feedFilters, { enabled: feedEnabled, feed: filters.feed });

  const { newCount, refresh } = useNewPublicationsPill(feedFilters, feedEnabled);

  const sentinelRef = useInfiniteScrollSentinel({
    onIntersect: fetchNextPage,
    enabled: !!hasNextPage && !isFetchingNextPage,
  });

  const publications = data?.pages.flatMap((p) => p.content) ?? [];
  const totalElements = data?.pages[0]?.totalElements ?? 0;
  const followingEmpty = followingMode && isAuthenticated && !followingQuery.isPending && followingIds.length === 0;
  const mineEmpty = filters.author === "me" && data && publications.length === 0;
  const showFeedLoader =
    (isPending || (isFetching && !isFetchingNextPage && publications.length === 0)) &&
    !followingEmpty &&
    !followingQuery.isError;

  function switchFeed(feed: PublicationsFeedMode) {
    if (feed === filters.feed) return;
    // Clear feed cache first so the UI never flashes the previous tab’s posts.
    void queryClient.resetQueries({ queryKey: ["publications", "feed"] });
    void queryClient.invalidateQueries({ queryKey: ["publications", "following-author-ids"] });
    void setFilters({
      feed,
      author: null,
      ...(feed === "following"
        ? { search: null, category: null, time: null, userIds: [] }
        : {}),
    });
  }

  function openComposer() {
    void setCompose(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="grid w-full grid-cols-1 gap-5 px-4 py-8 sm:px-5 xl:grid-cols-[240px_minmax(0,1fr)_260px] xl:items-start xl:gap-x-6 xl:px-12 xl:py-10 2xl:grid-cols-[260px_minmax(0,1fr)_280px] 2xl:gap-x-8 2xl:px-16">
      <aside className={cn(SIDE_RAIL, "hidden w-full justify-self-start xl:block")}>
        <PublicationsLeftRail
          onOpenPublication={(id) => openDetail(id)}
          onCompose={openComposer}
          onSwitchFeed={switchFeed}
          renderFollowSlot={renderAuthorFollowSlot}
        />
      </aside>

      <div className="mx-auto flex w-full min-w-0 max-w-[680px] flex-col gap-5 xl:max-w-[700px]">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl font-bold tracking-[-0.02em] text-[color:var(--color-text-heading)] sm:text-[1.75rem]">
            Публикации
          </h1>
          <p className="text-sm text-[color:var(--color-text-secondary)]">
            Местната социална лента на Смолян — новини, инициативи и мнения.
          </p>
        </div>

        <div className="flex flex-col gap-3 xl:hidden">
          <PublicationsUnifiedSearch
            onSearchFeed={(query) => setFilters({ search: query, feed: "all", author: null })}
            onSelectPublication={(id) => openDetail(id)}
            onFilterAuthor={(userId) =>
              setFilters({
                userIds: filters.userIds.includes(userId) ? filters.userIds : [...filters.userIds, userId],
                feed: "all",
                author: null,
              })
            }
          />
          <div className="flex flex-wrap gap-2 text-sm">
            <button
              type="button"
              onClick={openComposer}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-[image:var(--gradient-primary)] px-3 py-1.5 font-semibold text-white"
            >
              <i className="bi bi-plus-lg" />
              Нова
            </button>
            <Link href="/publications/saved" className="inline-flex items-center gap-1 text-primary hover:underline">
              <i className="bi bi-bookmark" /> Запазени
            </Link>
          </div>
        </div>

        <PublicationsFeedTabs feed={filters.feed} onChange={switchFeed} />

        <PublicationComposer
          forceExpanded={compose}
          onExpandedChange={(next) => {
            if (!next) void setCompose(false);
          }}
        />

        <PublicationsFilters />

        {newCount > 0 && (
          <button
            type="button"
            onClick={refresh}
            className="sticky top-[calc(var(--navbar-height)+8px)] z-10 mx-auto inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-[image:var(--gradient-primary)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-md)]"
          >
            <i className="bi bi-arrow-clockwise" />
            {newCount === 1 ? "1 нова публикация" : `${newCount} нови публикации`}
          </button>
        )}

        {followingMode && !isAuthenticated && (
          <EmptyState
            icon="bi-person-lock"
            title="Влезте, за да видите следвани"
            description="Лентата „Следвани“ показва публикации от хората, които следвате."
          />
        )}

        {followingMode && isAuthenticated && followingQuery.isPending && (
          <div className="flex justify-center py-8">
            <LogoLoader size="md" label="Зареждане на следвани…" />
          </div>
        )}

        {followingMode && isAuthenticated && followingQuery.isError && (
          <ErrorState
            description="Списъкът със следвани не можа да се зареди."
            onRetry={() => void followingQuery.refetch()}
          />
        )}

        {followingEmpty && !followingQuery.isError && (
          <EmptyState
            icon="bi-people"
            title="Все още не следвате никого"
            description="Последвайте автори, за да виждате публикациите им тук."
          />
        )}

        {showFeedLoader && (
          <div className="flex min-h-[240px] items-center justify-center py-12">
            <LogoLoader size="lg" label="Зареждане на публикации…" />
          </div>
        )}

        {!showFeedLoader && !followingEmpty && !followingQuery.isError && isError && (
          <ErrorState description="Публикациите не можаха да се заредят." onRetry={() => refetch()} />
        )}

        {!showFeedLoader && !followingEmpty && !followingQuery.isError && mineEmpty && (
          <EmptyState
            icon="bi-person-lines-fill"
            title="Все още нямате публикации"
            description="Напишете първата си публикация от бутона „Нова публикация“."
          />
        )}

        {!showFeedLoader && !followingEmpty && !followingQuery.isError && !mineEmpty && data && publications.length === 0 && (
          <EmptyState
            icon="bi-file-text"
            title="Няма намерени публикации"
            description={
              followingMode
                ? "Хората, които следвате, все още нямат публикации (или филтрите ги скриват)."
                : "Опитайте да промените филтрите или търсенето."
            }
          />
        )}

        {!showFeedLoader && !followingEmpty && !followingQuery.isError && data && publications.length > 0 && (
          <>
            <p className="text-sm text-[color:var(--color-text-muted)]">
              Намерени {totalElements} {totalElements === 1 ? "публикация" : "публикации"}
              {filters.author === "me" ? " · моите" : ""}
            </p>
            <div className="flex flex-col gap-4">
              {publications.map((publication) => (
                <PublicationCard
                  key={publication.id}
                  publication={publication}
                  onOpenDetail={openDetail}
                  onHashtagClick={(tag) => setFilters({ search: tag, feed: "all", author: null })}
                  followSlot={renderFollowSlot?.(publication)}
                  reportSlot={renderReportSlot?.(publication)}
                  reactionUserFollowSlot={renderAuthorFollowSlot}
                  reactionUserMessageSlot={renderAuthorMessageSlot}
                />
              ))}
            </div>

            <div ref={sentinelRef} className="flex justify-center py-4">
              {isFetchingNextPage && <LogoLoader size="sm" label="Зареждане…" />}
            </div>
          </>
        )}
      </div>

      <aside className={cn(SIDE_RAIL, "w-full xl:justify-self-end")}>
        <PublicationsSidebar
          onOpenPost={(id) => openDetail(id)}
          onTrendingClick={(topic) => setFilters({ search: topic, feed: "all", author: null })}
          renderAuthorFollowSlot={renderAuthorFollowSlot}
          renderAuthorMessageSlot={renderAuthorMessageSlot}
        />
      </aside>

      <PublicationDetailModal
        id={openId}
        focusComments={focusComments}
        onClose={closeDetail}
        followSlot={renderFollowSlot}
        reportSlot={renderReportSlot}
        commentsSlot={renderCommentsSlot}
        reactionUserFollowSlot={renderAuthorFollowSlot}
        reactionUserMessageSlot={renderAuthorMessageSlot}
        onHashtagClick={(tag) => {
          closeDetail();
          setFilters({ search: tag, feed: "all", author: null });
        }}
      />
    </div>
  );
}
