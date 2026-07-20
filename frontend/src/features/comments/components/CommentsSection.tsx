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
}

/** Self-contained comments block — used on all 3 event detail pages (and future publication/signal pages). */
export function CommentsSection({ entityType, entityId }: CommentsSectionProps) {
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
      },
      onError: (error) => toast.error(errorMessage(error, "Коментарът не бе публикуван.")),
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[color:var(--color-text-heading)]">
          Коментари {totalElements > 0 && `(${totalElements})`}
        </h2>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as CommentSort)}
          className="h-9 rounded-[var(--radius-md)] border border-border-default/60 bg-white px-2 text-sm outline-none"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <CommentForm isPending={addComment.isPending} onSubmit={handleAddComment} />

      {isPending && (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {isError && <ErrorState description="Коментарите не можаха да се заредят." onRetry={() => refetch()} />}

      {!isPending && !isError && comments.length === 0 && (
        <EmptyState icon="bi-chat-square-text" title="Все още няма коментари" description="Бъдете първи, коментирайте." />
      )}

      {comments.length > 0 && (
        <div className="flex flex-col gap-5">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} entityType={entityType} entityId={entityId} sort={sort} />
          ))}
        </div>
      )}

      {hasNextPage && (
        <Button
          type="button"
          variant="outline"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="self-center"
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
      )}
    </div>
  );
}
