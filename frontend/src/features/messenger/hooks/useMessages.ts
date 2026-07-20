"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { messengerApi } from "../api";

export function messagesQueryKey(conversationId: number) {
  return ["messenger", "messages", conversationId] as const;
}

/**
 * Page 0 = newest 50 (backend `ORDER BY sentAt DESC`). Older pages load
 * on scroll-up. Flattened chronological list is built by the consumer
 * (reverse each page, then concat oldest→newest).
 */
export function useMessages(conversationId: number | null) {
  return useInfiniteQuery({
    queryKey: conversationId != null ? messagesQueryKey(conversationId) : ["messenger", "messages", "none"],
    queryFn: ({ pageParam }) => messengerApi.messages(conversationId as number, pageParam, 50),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.number + 1),
    enabled: conversationId != null,
    staleTime: 10_000,
  });
}
