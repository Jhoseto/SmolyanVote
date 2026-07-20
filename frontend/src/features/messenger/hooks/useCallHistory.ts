"use client";

import { useQuery } from "@tanstack/react-query";
import { messengerApi } from "../api";

export function callHistoryQueryKey(conversationId: number) {
  return ["messenger", "call-history", conversationId] as const;
}

export function useCallHistory(conversationId: number) {
  return useQuery({
    queryKey: callHistoryQueryKey(conversationId),
    queryFn: () => messengerApi.callHistory(conversationId),
    enabled: conversationId > 0,
    staleTime: 30_000,
  });
}
