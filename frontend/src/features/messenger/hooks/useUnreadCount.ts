"use client";

import { useQuery } from "@tanstack/react-query";
import { messengerApi } from "../api";
import { useAuth } from "@/shared/lib/authContext";
import { useStompConnectionState } from "./useStompConnectionState";

export const UNREAD_COUNT_QUERY_KEY = ["messenger", "unread-count"] as const;

export function useUnreadCount() {
  const { isAuthenticated } = useAuth();
  const stompState = useStompConnectionState();
  const pollWhileDown = isAuthenticated && stompState !== "connected";

  return useQuery({
    queryKey: UNREAD_COUNT_QUERY_KEY,
    queryFn: async () => {
      const res = await messengerApi.unreadCount();
      return res.count;
    },
    enabled: isAuthenticated,
    staleTime: 10_000,
    refetchInterval: pollWhileDown ? 10_000 : false,
  });
}
