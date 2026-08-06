"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Skeleton, EmptyState, ErrorState, LogoLoader } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useToast } from "@/shared/hooks/useToast";
import { useRequireAuth } from "@/shared/hooks/useRequireAuth";
import { useCanInteract } from "@/features/moderation/hooks/useCanInteract";
import { errorMessage } from "@/shared/lib/errorMessage";
import { useComments, commentsQueryKey } from "../hooks/useComments";
import { useAddComment } from "../hooks/useCommentMutations";
import { CommentForm } from "./CommentForm";
import { CommentItem } from "./CommentItem";
import type { CommentEntityType, CommentSort } from "../types";

const SORT_OPTIONS: { value: CommentSort; label: string }[] = [
  { value: "newest", label: "Най-нови" },
  { value: "oldest", label: "Най-стари" },
  { value: "popular", label: "Най-популярни" },
];

interface CommentsSectionProps {
  entityType: CommentEntityType;
  entityId: number;
  onCommentAdded?: () => void;
  /** Show a button first; form opens on demand (read-first). */
  lazyCompose?: boolean;
  /** Override displayed count (e.g. top-level + replies). */
  totalCount?: number;
  /** Do not render the "Коментари" heading (parent already shows one). */
  hideHeading?: boolean;
}

/** Self-contained comments block — used on event detail pages and publication modal. */
export function CommentsSection({
  entityType,
  entityId,
  onCommentAdded,
  lazyCompose = false,
  totalCount,
  hideHeading = false,
}: CommentsSectionProps) {
  const toast = useToast();
  const requireAuth = useRequireAuth();
  const canInteract = useCanInteract();
  const queryClient = useQueryClient();
  const [sort, setSort] = useState<CommentSort>("newest");
  const [composeOpen, setComposeOpen] = useState(false);

  const { data, isPending, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useComments(
    entityType,
    entityId,
    sort,
  );
  const addComment = useAddComment(entityType, entityId);

  const comments = data?.pages.flatMap((page) => page.comments) ?? [];
  const totalElements = data?.pages[0]?.totalElements ?? 0;
  const displayCount = totalCount ?? totalElements;

  async function handleAddComment(text: string) {
    if (!(await requireAuth("да коментираш"))) return;
    addComment.mutate(text, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: commentsQueryKey(entityType, entityId, sort) });
        onCommentAdded?.();
        if (lazyCompose) setComposeOpen(false);
      },
      onError: (error) => toast.error(errorMessage(error, "Коментарът не бе публикуван.")),
    });
  }

  const composeBlock = canInteract ? (
    lazyCompose && !composeOpen ? (
      <button
        type="button"
        onClick={() => setComposeOpen(true)}
        className="flex w-full items-center gap-2 rounded-[var(--radius-md)] border border-border-default/60 bg-white px-3 py-2.5 text-left text-sm text-[color:var(--color-text-muted)] transition-colors hover:border-primary/40 hover:text-[color:var(--color-text-secondary)]"
      >
        <i className="bi bi-pencil-square text-primary" aria-hidden />
        Напиши коментар…
      </button>
    ) : (
      <CommentForm
        isPending={addComment.isPending}
        onSubmit={handleAddComment}
        autoFocus={lazyCompose && composeOpen}
        onCancel={lazyCompose ? () => setComposeOpen(false) : undefined}
      />
    )
  ) : (
    <p className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
      <i className="bi bi-shield-exclamation mr-1.5" aria-hidden />
      Коментирането е изключено, докато профилът ви е ограничен.
    </p>
  );

  const commentsList = (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
      {isPending && (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {isError && <ErrorState description="Коментарите не можаха да се заредят." onRetry={() => refetch()} />}

      {!isPending && !isError && comments.length === 0 && (
        <EmptyState
          icon="bi-chat-square-text"
          title="Все още няма коментари"
          description="Бъдете първи, коментирайте."
        />
      )}

      {comments.length > 0 && (
        <div className="flex flex-col gap-5 pb-2">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              entityType={entityType}
              entityId={entityId}
              sort={sort}
            />
          ))}
        </div>
      )}

      {hasNextPage && (
        <div className="flex justify-center py-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <span className="inline-flex items-center gap-2">
                <LogoLoader size="sm" showLabel={false} />
                Зареждане…
              </span>
            ) : (
              "Заредете още коментари"
            )}
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div
        className={cn(
          "flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center",
          hideHeading ? "sm:justify-end" : "sm:justify-between",
        )}
      >
        {!hideHeading ? (
          <h2 className="font-display text-base font-semibold text-[color:var(--color-text-heading)]">
            Коментари {displayCount > 0 ? `(${displayCount})` : null}
          </h2>
        ) : null}
        <div className="flex flex-wrap gap-1.5">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSort(opt.value)}
              className={
                sort === opt.value
                  ? "rounded-[var(--radius-pill)] bg-primary px-3 py-1 text-xs font-semibold text-white"
                  : "rounded-[var(--radius-pill)] border border-border-default/60 bg-white px-3 py-1 text-xs font-medium text-[color:var(--color-text-secondary)] hover:border-primary/40 hover:text-primary"
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {lazyCompose ? (
        <>
          {commentsList}
          <div className="shrink-0 border-t border-border-default/50 pt-3">{composeBlock}</div>
        </>
      ) : (
        <>
          <div className="shrink-0">{composeBlock}</div>
          {commentsList}
        </>
      )}
    </div>
  );
}
