"use client";

import { parseAsString, parseAsStringEnum, useQueryStates } from "nuqs";

export type PodcastSortOption = "newest" | "oldest" | "popular" | "longest" | "shortest";

const SORT_OPTIONS: PodcastSortOption[] = ["newest", "oldest", "popular", "longest", "shortest"];

/** URL-backed search + sort — client-side filter over the full episode list. */
export function usePodcastFilters() {
  return useQueryStates(
    {
      q: parseAsString.withDefault(""),
      sort: parseAsStringEnum<PodcastSortOption>(SORT_OPTIONS).withDefault("newest"),
    },
    { history: "replace", shallow: true },
  );
}
