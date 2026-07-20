"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/shared/lib/authContext";
import { notificationsApi } from "../api";

/** Powers the bell dropdown — last 10, server-ordered (newest first). */
export function useRecentNotifications() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["notifications", "recent"],
    queryFn: () => notificationsApi.recent(10),
    enabled: isAuthenticated,
    staleTime: 15_000,
  });
}
