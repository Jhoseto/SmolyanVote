"use client";

import { parseAsBoolean, parseAsString, parseAsStringEnum, useQueryStates } from "nuqs";
import type { SignalCategory, SignalSortOption } from "../types";
import { SIGNAL_CATEGORIES } from "../data/categories";

const CATEGORY_OPTIONS = SIGNAL_CATEGORIES.map((c) => c.value) as SignalCategory[];
const SORT_OPTIONS: SignalSortOption[] = ["newest", "oldest", "popular", "viewed"];

/** URL search params = единствен source of truth (виж `usePublicationsFilters`) — независим nuqs namespace от `useSignalDetailModal`'s `openSignal`. */
export function useSignalsFilters() {
  return useQueryStates(
    {
      search: parseAsString.withDefault(""),
      category: parseAsStringEnum<SignalCategory>(CATEGORY_OPTIONS),
      showExpired: parseAsBoolean.withDefault(false),
      sort: parseAsStringEnum<SignalSortOption>(SORT_OPTIONS).withDefault("newest"),
    },
    { history: "push" },
  );
}
