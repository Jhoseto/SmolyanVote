"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { publicationsApi } from "../api";
import type { PublicationsListParams } from "../types";

export const PUBLICATIONS_PAGE_SIZE = 10;

type FeedFilters = Omit<PublicationsListParams, "page" | "size">;

/**
 * Infinite-scroll feed (server-only filtering — a filter change produces a
 * new query key, so TanStack Query refetches page 0 instead of client-side
 * re-filtering already-loaded pages). Mirrors legacy `publicationsMain.js`
 * infinite scroll, without the manual DOM/scroll-listener bookkeeping.
 */
export function usePublicationsFeed(filters: FeedFilters) {
  return useInfiniteQuery({
    queryKey: ["publications", "feed", filters],
    queryFn: ({ pageParam }) =>
      publicationsApi.list({ ...filters, page: pageParam, size: PUBLICATIONS_PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    staleTime: 30_000,
  });
}
