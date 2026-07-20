"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, LogoLoader } from "@/shared/ui";
import { useToast } from "@/shared/hooks/useToast";
import { useConfirm } from "@/shared/hooks/useConfirm";
import { useRequireAuth } from "@/shared/hooks/useRequireAuth";
import { errorMessage } from "@/shared/lib/errorMessage";
import { formatRelativeDate } from "@/shared/lib/formatRelativeDate";
import { cn } from "@/shared/lib/cn";
import {
  useAddReply,
  useDeleteComment,
  useToggleCommentVote,
  useUpdateComment,
} from "../hooks/useCommentMutations";
import { useReplies } from "../hooks/useReplies";
import type { CommentDto, CommentEntityType, CommentSort } from "../types";
import { commentsQueryKey } from "../hooks/useComments";
import { CommentForm } from "./CommentForm";

interface CommentItemProps {
  comment: CommentDto;
  entityType: CommentEntityType;
  entityId: number;
  sort: CommentSort;
  isReply?: boolean;
}

export function CommentItem({ comment, entityType, entityId, sort, isReply }: CommentItemProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const requireAuth = useRequireAuth();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();
  const toggleVote = useToggleCommentVote();
  const addReply = useAddReply(comment.id);
  const repliesQuery = useReplies(comment.id, showReplies);

  function invalidateList() {
    queryClient.invalidateQueries({ queryKey: commentsQueryKey(entityType, entityId, sort) });
  }

  function invalidateReplies() {
    if (comment.parentId) {
      queryClient.invalidateQueries({ queryKey: ["comments", "replies", comment.parentId] });
    } else {
      queryClient.invalidateQueries({ queryKey: ["comments", "replies", comment.id] });
    }
  }

  async function handleVote(reaction: "LIKE" | "DISLIKE") {
    if (!(await requireAuth("да гласуваш за коментар"))) return;
    toggleVote.mutate(
      { commentId: comment.id, reaction },
      { onError: (error) => toast.error(errorMessage(error, "Гласуването не бе успешно.")) },
    );
  }

  function handleUpdate(text: string) {
    updateComment.mutate(
      { commentId: comment.id, text },
      {
        onSuccess: () => {
          setIsEditing(false);
          invalidateList();
          invalidateReplies();
        },
        onError: (error) => toast.error(errorMessage(error, "Редакцията не бе успешна.")),
      },
    );
  }

  async function handleDelete() {
    const ok = await confirm({
      title: "Изтриване на коментар",
      description: "Сигурни ли сте, че искате да изтриете този коментар?",
      confirmText: "Изтрий",
      destructive: true,
    });
    if (!ok) return;

    deleteComment.mutate(comment.id, {
      onSuccess: () => {
        toast.success("Коментарът е изтрит.");
        invalidateList();
        invalidateReplies();
      },
      onError: (error) => toast.error(errorMessage(error, "Изтриването не бе успешно.")),
    });
  }

  async function handleReplySubmit(text: string) {
    if (!(await requireAuth("да отговориш"))) return;
    addReply.mutate(text, {
      onSuccess: () => {
        setIsReplying(false);
        setShowReplies(true);
        invalidateList();
        invalidateReplies();
      },
      onError: (error) => toast.error(errorMessage(error, "Отговорът не бе публикуван.")),
    });
  }

  const likes = toggleVote.data?.likesCount ?? comment.likesCount;
  const dislikes = toggleVote.data?.dislikesCount ?? comment.dislikesCount;
  const userReaction = toggleVote.data?.userReaction ?? comment.userReaction;

  return (
    <div className={cn("flex gap-3", isReply && "ml-10 sm:ml-12")}>
      <Avatar username={comment.author} imageUrl={comment.authorImage} size={isReply ? 32 : 40} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-semibold text-[color:var(--color-text-primary)]">{comment.author}</span>
          {comment.online && <span className="h-2 w-2 rounded-full bg-[color:var(--color-success)]" title="Онлайн" />}
          <span className="text-xs text-[color:var(--color-text-muted)]">
            {formatRelativeDate(comment.createdAt)}
            {comment.edited && " · редактиран"}
          </span>
        </div>

        {isEditing ? (
          <div className="mt-1.5">
            <CommentForm
              initialValue={comment.text}
              submitLabel="Запази"
              autoFocus
              isPending={updateComment.isPending}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        ) : (
          <p className="mt-1 whitespace-pre-wrap text-sm text-[color:var(--color-text-secondary)]">{comment.text}</p>
        )}

        <div className="mt-1.5 flex items-center gap-4 text-xs text-[color:var(--color-text-muted)]">
          <button
            type="button"
            onClick={() => handleVote("LIKE")}
            disabled={toggleVote.isPending}
            className={cn("flex items-center gap-1 hover:text-primary", userReaction === "LIKE" && "text-primary")}
          >
            <i className={cn("bi", userReaction === "LIKE" ? "bi-hand-thumbs-up-fill" : "bi-hand-thumbs-up")} />
            {likes}
          </button>
          <button
            type="button"
            onClick={() => handleVote("DISLIKE")}
            disabled={toggleVote.isPending}
            className={cn(
              "flex items-center gap-1 hover:text-[color:var(--color-error)]",
              userReaction === "DISLIKE" && "text-[color:var(--color-error)]",
            )}
          >
            <i className={cn("bi", userReaction === "DISLIKE" ? "bi-hand-thumbs-down-fill" : "bi-hand-thumbs-down")} />
            {dislikes}
          </button>
          {!isReply && (
            <button type="button" onClick={() => setIsReplying((v) => !v)} className="hover:text-primary">
              Отговори
            </button>
          )}
          {comment.canEdit && (
            <>
              <button type="button" onClick={() => setIsEditing(true)} className="hover:text-primary">
                Редактирай
              </button>
              <button type="button" onClick={handleDelete} className="hover:text-[color:var(--color-error)]">
                Изтрий
              </button>
            </>
          )}
        </div>

        {isReplying && (
          <div className="mt-3 ml-10">
            <CommentForm
              placeholder={`Отговор до ${comment.author}…`}
              submitLabel="Отговори"
              autoFocus
              isPending={addReply.isPending}
              onSubmit={handleReplySubmit}
              onCancel={() => setIsReplying(false)}
            />
          </div>
        )}

        {!isReply && comment.repliesCount > 0 && (
          <button
            type="button"
            onClick={() => setShowReplies((v) => !v)}
            className="mt-2 text-xs font-medium text-primary hover:underline"
          >
            {showReplies ? "Скрий отговорите" : `Покажи ${comment.repliesCount} отговор(а)`}
          </button>
        )}

        {showReplies && (
          <div className="mt-3 flex flex-col gap-3">
            {repliesQuery.isPending && (
              <div className="py-2">
                <LogoLoader size="sm" label="Зареждане…" />
              </div>
            )}
            {repliesQuery.data?.comments.map((reply) => (
              <CommentItem key={reply.id} comment={reply} entityType={entityType} entityId={entityId} sort={sort} isReply />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
