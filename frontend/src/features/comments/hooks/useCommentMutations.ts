"use client";

import { useMutation } from "@tanstack/react-query";
import { commentsApi } from "../api";
import type { CommentEntityType, CommentReaction } from "../types";

/** Write-only mutations — callers invalidate/refetch the relevant list on success. */

export function useAddComment(entityType: CommentEntityType, entityId: number) {
  return useMutation({
    mutationFn: (text: string) => commentsApi.add(entityType, entityId, text),
  });
}

export function useAddReply(parentCommentId: number) {
  return useMutation({
    mutationFn: (text: string) => commentsApi.reply(parentCommentId, text),
  });
}

export function useUpdateComment() {
  return useMutation({
    mutationFn: ({ commentId, text }: { commentId: number; text: string }) => commentsApi.update(commentId, text),
  });
}

export function useDeleteComment() {
  return useMutation({
    mutationFn: (commentId: number) => commentsApi.remove(commentId),
  });
}

export function useToggleCommentVote() {
  return useMutation({
    mutationFn: ({ commentId, reaction }: { commentId: number; reaction: Exclude<CommentReaction, "NONE"> }) =>
      commentsApi.toggleVote(commentId, reaction),
  });
}
