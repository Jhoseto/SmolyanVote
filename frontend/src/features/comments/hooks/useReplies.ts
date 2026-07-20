"use client";

import { useQuery } from "@tanstack/react-query";
import { commentsApi } from "../api";

/** Fetched lazily — only enabled once the user expands a comment's replies. */
export function useReplies(commentId: number, enabled: boolean) {
  return useQuery({
    queryKey: ["comments", "replies", commentId],
    queryFn: () => commentsApi.replies(commentId),
    enabled,
  });
}
