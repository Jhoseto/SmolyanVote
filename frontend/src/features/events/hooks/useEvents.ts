"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/shared/lib/authContext";
import { eventsApi } from "../api";

export const EVENTS_CATALOG_QUERY_KEY = ["events", "catalog"] as const;

/** Loads the full events catalog once; filter/sort/page are client-side. */
export function useEventsCatalog() {
  const { user } = useAuth();

  return useQuery({
    // Include auth identity so follow/vote meta refreshes after login/logout.
    queryKey: [...EVENTS_CATALOG_QUERY_KEY, user?.id ?? "anon"],
    queryFn: () => eventsApi.list(),
    staleTime: 30_000,
  });
}
