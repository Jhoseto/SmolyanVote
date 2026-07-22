"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Container, EmptyState, ErrorState, LogoLoader } from "@/shared/ui";
import { useAuth } from "@/shared/lib/authContext";
import { useLoginGateStore } from "@/shared/lib/loginGateStore";
import { useInfiniteScrollSentinel } from "@/shared/hooks/useInfiniteScrollSentinel";
import { useBookmarkedPublications } from "../hooks/useBookmarkedPublications";
import { usePublicationDetailModal } from "../hooks/usePublicationDetailModal";
import { PublicationCard } from "./PublicationCard";
import { PublicationDetailModal } from "./PublicationDetailModal";
import type { Publication } from "../types";

interface SavedPublicationsPageProps {
  renderFollowSlot?: (publication: Publication) => ReactNode;
  renderReportSlot?: (publication: Publication) => ReactNode;
  renderCommentsSlot?: (id: number) => ReactNode;
  renderAuthorFollowSlot?: (userId: number) => ReactNode;
}

export function SavedPublicationsPage({
  renderFollowSlot,
  renderReportSlot,
  renderCommentsSlot,
  renderAuthorFollowSlot,
}: SavedPublicationsPageProps = {}) {
  const { isAuthenticated, isHydrated } = useAuth();
  const openAuth = useLoginGateStore((s) => s.open);
  const { openId, focusComments, open: openDetail, close: closeDetail } = usePublicationDetailModal();

  const { data, isPending, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useBookmarkedPublications(isAuthenticated);

  const sentinelRef = useInfiniteScrollSentinel({
    onIntersect: fetchNextPage,
    enabled: !!hasNextPage && !isFetchingNextPage,
  });

  const publications = data?.pages.flatMap((p) => p.content) ?? [];

  if (isHydrated && !isAuthenticated) {
    return (
      <Container className="py-12">
        <EmptyState
          icon="bi-bookmark"
          title="Запазени публикации"
          description="Влезте, за да виждате публикациите, които сте запазили."
          action={
            <button
              type="button"
              onClick={() => openAuth("login")}
              className="btn-brand rounded-[var(--radius-pill)] px-5 py-2 text-sm font-semibold text-white"
            >
              Вход
            </button>
          }
        />
      </Container>
    );
  }

  return (
    <Container className="mx-auto max-w-2xl py-8">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[color:var(--color-text-heading)]">
            Запазени
          </h1>
          <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
            Публикации, които сте маркирали с отметка.
          </p>
        </div>
        <Link href="/publications" className="text-sm font-medium text-primary hover:underline">
          Към лентата
        </Link>
      </div>

      {isPending && (
        <div className="flex justify-center py-16">
          <LogoLoader size="lg" label="Зареждане…" />
        </div>
      )}

      {isError && (
        <ErrorState description="Запазените публикации не можаха да се заредят." onRetry={() => refetch()} />
      )}

      {data && publications.length === 0 && (
        <EmptyState
          icon="bi-bookmark"
          title="Все още няма запазени"
          description="Натиснете „Запази“ на публикация, за да я видите тук."
        />
      )}

      {publications.length > 0 && (
        <div className="flex flex-col gap-4">
          {publications.map((publication) => (
            <PublicationCard
              key={publication.id}
              publication={publication}
              onOpenDetail={openDetail}
              followSlot={renderFollowSlot?.(publication)}
              reportSlot={renderReportSlot?.(publication)}
              reactionUserFollowSlot={renderAuthorFollowSlot}
            />
          ))}
          <div ref={sentinelRef} className="flex justify-center py-4">
            {isFetchingNextPage && <LogoLoader size="sm" label="Зареждане…" />}
          </div>
        </div>
      )}

      <PublicationDetailModal
        id={openId}
        focusComments={focusComments}
        onClose={closeDetail}
        followSlot={renderFollowSlot}
        reportSlot={renderReportSlot}
        commentsSlot={renderCommentsSlot}
        reactionUserFollowSlot={renderAuthorFollowSlot}
      />
    </Container>
  );
}
