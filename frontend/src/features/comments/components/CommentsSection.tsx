"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Skeleton, EmptyState, ErrorState, LogoLoader } from "@/shared/ui";
import { useToast } from "@/shared/hooks/useToast";
import { useRequireAuth } from "@/shared/hooks/useRequireAuth";
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
}

/** Self-contained comments block — used on event detail pages and publication modal. */
export function CommentsSection({ entityType, entityId, onCommentAdded }: CommentsSectionProps) {
  const toast = useToast();
  const requireAuth = useRequireAuth();
  const queryClient = useQueryClient();
  const [sort, setSort] = useState<CommentSort>("newest");

  const { data, isPending, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useComments(
    entityType,
    entityId,
    sort,
  );
  const addComment = useAddComment(entityType, entityId);

  const comments = data?.pages.flatMap((page) => page.comments) ?? [];
  const totalElements = data?.pages[0]?.totalElements ?? 0;

  async function handleAddComment(text: string) {
    if (!(await requireAuth("да коментираш"))) return;
    addComment.mutate(text, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: commentsQueryKey(entityType, entityId, sort) });
        onCommentAdded?.();
      },
      onError: (error) => toast.error(errorMessage(error, "Коментарът не бе публикуван.")),
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-base font-semibold text-[color:var(--color-text-heading)]">
          Коментари {totalElements > 0 && `(${totalElements})`}
        </h2>
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

      <div className="shrink-0">
        <CommentForm isPending={addComment.isPending} onSubmit={handleAddComment} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
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
    </div>
  );
}
