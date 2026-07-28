"use client";

import { parseAsBoolean, parseAsString, parseAsStringEnum, useQueryStates } from "nuqs";
import type { SignalCategory, SignalSortOption, SignalTimeFilter } from "../types";
import { SIGNAL_CATEGORIES } from "../data/categories";

const CATEGORY_OPTIONS = SIGNAL_CATEGORIES.map((c) => c.value) as SignalCategory[];
const SORT_OPTIONS: SignalSortOption[] = ["newest", "oldest", "popular", "viewed"];
const TIME_OPTIONS = ["", "today", "week", "month"] as SignalTimeFilter[];

/** URL search params = единствен source of truth — client-side filter, no refetch. */
export function useSignalsFilters() {
  return useQueryStates(
    {
      search: parseAsString.withDefault(""),
      category: parseAsStringEnum<SignalCategory>(CATEGORY_OPTIONS),
      showInactive: parseAsBoolean.withDefault(false),
      sort: parseAsStringEnum<SignalSortOption>(SORT_OPTIONS).withDefault("newest"),
      time: parseAsStringEnum<SignalTimeFilter>(TIME_OPTIONS).withDefault(""),
      mineOnly: parseAsBoolean.withDefault(false),
      boostedOnly: parseAsBoolean.withDefault(false),
      highPriorityOnly: parseAsBoolean.withDefault(false),
      resolvedOnly: parseAsBoolean.withDefault(false),
      nearMe: parseAsBoolean.withDefault(false),
    },
    { history: "push" },
  );
}
