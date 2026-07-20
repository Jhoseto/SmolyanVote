"use client";

import { useQuery } from "@tanstack/react-query";
import { publicationsApi } from "../api";

/**
 * Right sidebar widgets (MODERN_FRONTEND_PLAN.md §Right sidebar widgets) — one
 * query per widget so a slow one never blocks the rest. `refetchInterval` +
 * default `refetchIntervalInBackground: false` = "auto-refresh while the tab
 * is visible" (TanStack Query pauses the interval via the Page Visibility API
 * when the tab is hidden, resumes on refocus — no manual visibility listener).
 */
const SIDEBAR_REFETCH_INTERVAL = 60_000;

export function usePublicationsSidebarStats() {
  return useQuery({
    queryKey: ["publications", "sidebar", "stats"],
    queryFn: () => publicationsApi.sidebarStats(),
    staleTime: SIDEBAR_REFETCH_INTERVAL,
    refetchInterval: SIDEBAR_REFETCH_INTERVAL,
  });
}

export function useTopAuthors() {
  return useQuery({
    queryKey: ["publications", "sidebar", "top-authors"],
    queryFn: () => publicationsApi.sidebarTopAuthors(),
    staleTime: SIDEBAR_REFETCH_INTERVAL,
    refetchInterval: SIDEBAR_REFETCH_INTERVAL,
  });
}

export function useTrendingTopics() {
  return useQuery({
    queryKey: ["publications", "sidebar", "trending"],
    queryFn: () => publicationsApi.sidebarTrending(),
    staleTime: SIDEBAR_REFETCH_INTERVAL,
    refetchInterval: SIDEBAR_REFETCH_INTERVAL,
  });
}

export function useLastActivity() {
  return useQuery({
    queryKey: ["publications", "sidebar", "last-activity"],
    queryFn: () => publicationsApi.sidebarLastActivity(),
    staleTime: 30_000,
    refetchInterval: SIDEBAR_REFETCH_INTERVAL,
  });
}

export function useMostCommentedToday() {
  return useQuery({
    queryKey: ["publications", "sidebar", "most-commented"],
    queryFn: () => publicationsApi.sidebarMostCommented(),
    staleTime: SIDEBAR_REFETCH_INTERVAL,
    refetchInterval: SIDEBAR_REFETCH_INTERVAL,
  });
}

export function useTopViewedToday() {
  return useQuery({
    queryKey: ["publications", "sidebar", "top-viewed"],
    queryFn: () => publicationsApi.sidebarTopViewed(),
    staleTime: SIDEBAR_REFETCH_INTERVAL,
    refetchInterval: SIDEBAR_REFETCH_INTERVAL,
  });
}
