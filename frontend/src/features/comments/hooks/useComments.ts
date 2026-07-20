"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { commentsApi } from "../api";
import type { CommentEntityType, CommentSort } from "../types";

export function commentsQueryKey(entityType: CommentEntityType, entityId: number, sort: CommentSort) {
  return ["comments", entityType, entityId, sort] as const;
}

/** Top-level comments for an entity — "Заредете още" loads the next page. */
export function useComments(entityType: CommentEntityType, entityId: number, sort: CommentSort) {
  return useInfiniteQuery({
    queryKey: commentsQueryKey(entityType, entityId, sort),
    queryFn: ({ pageParam }) => commentsApi.list(entityType, entityId, pageParam, sort),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => (lastPage.hasNext ? pages.length : undefined),
  });
}
