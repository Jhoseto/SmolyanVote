"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { profileApi } from "../api";

export const PROFILE_PUBLICATIONS_PAGE_SIZE = 9;

export function useProfilePublications(authorId: number | null) {
  return useInfiniteQuery({
    queryKey: ["profile", authorId, "publications"],
    queryFn: ({ pageParam }) => profileApi.publications(authorId as number, pageParam, PROFILE_PUBLICATIONS_PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => (lastPage.hasNext ? allPages.length : undefined),
    enabled: authorId != null,
    staleTime: 30_000,
  });
}
