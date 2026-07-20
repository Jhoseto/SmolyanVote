"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient, ApiError } from "@/lib/api/client";

export interface HomeStats {
  usersCount: number;
  simpleEventsCount: number;
  referendumsCount: number;
  multiPollsCount: number;
}

/** Home counters from `GET /api/v1/stats/home` — public, no auth required. */
export function useHomeStats() {
  return useQuery<HomeStats, ApiError>({
    queryKey: ["home", "stats"],
    queryFn: () => apiClient.get<HomeStats>("/api/v1/stats/home"),
    staleTime: 5 * 60_000,
  });
}
