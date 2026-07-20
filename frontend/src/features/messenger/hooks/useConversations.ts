"use client";

import { useQuery } from "@tanstack/react-query";
import { messengerApi } from "../api";
import { useAuth } from "@/shared/lib/authContext";
import { useStompConnectionState } from "./useStompConnectionState";

export const CONVERSATIONS_QUERY_KEY = ["messenger", "conversations"] as const;

export function useConversations() {
  const { isAuthenticated } = useAuth();
  const stompState = useStompConnectionState();
  const pollWhileDown = isAuthenticated && stompState !== "connected";

  return useQuery({
    queryKey: CONVERSATIONS_QUERY_KEY,
    queryFn: () => messengerApi.conversations(),
    enabled: isAuthenticated,
    staleTime: 15_000,
    refetchInterval: pollWhileDown ? 8_000 : false,
  });
}
