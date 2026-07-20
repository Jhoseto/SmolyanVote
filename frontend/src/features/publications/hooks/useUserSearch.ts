"use client";

import { useQuery } from "@tanstack/react-query";
import { publicationsApi } from "../api";

/** Debounced by the caller (see `AuthorSearchFilter`) — mirrors legacy `userSearch.js` (300ms, min 2 chars). */
export function useUserSearch(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: ["publications", "user-search", trimmed],
    queryFn: () => publicationsApi.searchUsers(trimmed),
    enabled: trimmed.length >= 2,
    staleTime: 30_000,
  });
}
