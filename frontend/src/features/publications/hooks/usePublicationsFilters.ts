"use client";

import { parseAsArrayOf, parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from "nuqs";
import type { PublicationCategory, PublicationSortOption, PublicationTimeFilter } from "../types";

const CATEGORY_OPTIONS: PublicationCategory[] = [
  "NEWS",
  "INFRASTRUCTURE",
  "MUNICIPAL",
  "INITIATIVES",
  "CULTURE",
  "OTHER",
];
const SORT_OPTIONS: PublicationSortOption[] = ["date-desc", "date-asc", "likes", "dislikes", "views", "comments"];
const TIME_OPTIONS: PublicationTimeFilter[] = ["today", "week", "month", "year"];

/**
 * URL search params = единствен source of truth за филтрите (nuqs) —
 * без localStorage-mirror, без popstate hack (виж `useEventsFilters`).
 */
export function usePublicationsFilters() {
  return useQueryStates(
    {
      search: parseAsString.withDefault(""),
      category: parseAsStringEnum<PublicationCategory>(CATEGORY_OPTIONS),
      time: parseAsStringEnum<PublicationTimeFilter>(TIME_OPTIONS),
      sort: parseAsStringEnum<PublicationSortOption>(SORT_OPTIONS).withDefault("date-desc"),
      userIds: parseAsArrayOf(parseAsInteger).withDefault([]),
    },
    { history: "push" },
  );
}
