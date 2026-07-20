"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/shared/lib/authContext";
import { notificationsApi } from "../api";
import { useNotificationSocketStatus } from "./useNotificationSocketStatus";

/**
 * Poll fallback only kicks in while the realtime socket isn't `"open"`
 * (MODERN_FRONTEND_PLAN: "auto-reconnect с exponential backoff + poll
 * fallback"). Once the socket connects, REST polling stops — the badge
 * updates purely from WS pushes (see `useNotificationRealtime`).
 */
export function useUnreadCount() {
  const { isAuthenticated } = useAuth();
  const socketStatus = useNotificationSocketStatus();

  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => notificationsApi.unreadCount(),
    enabled: isAuthenticated,
    staleTime: 15_000,
    refetchInterval: socketStatus === "open" ? false : 20_000,
  });
}
