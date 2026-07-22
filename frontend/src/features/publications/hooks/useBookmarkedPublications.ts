"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { publicationsApi } from "../api";
import { PUBLICATIONS_PAGE_SIZE } from "./usePublicationsFeed";

export function useBookmarkedPublications(enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ["publications", "bookmarked"],
    queryFn: ({ pageParam }) => publicationsApi.bookmarked({ page: pageParam, size: PUBLICATIONS_PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    enabled,
    staleTime: 30_000,
  });
}
