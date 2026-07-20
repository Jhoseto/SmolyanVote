"use client";

import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from "nuqs";
import type {
  EventDatePeriod,
  EventKind,
  EventPopularityFilter,
  EventQuickFilter,
  EventSortOption,
  EventStatusFilter,
} from "../types";

const SORT_OPTIONS: EventSortOption[] = ["date-desc", "date-asc", "popularity", "name"];
const TYPE_OPTIONS: EventKind[] = ["event", "referendum", "poll"];
const STATUS_OPTIONS: EventStatusFilter[] = ["active", "inactive"];
const POPULARITY_OPTIONS: EventPopularityFilter[] = ["most-voted", "most-viewed", "most-commented"];
const DATE_PERIOD_OPTIONS: EventDatePeriod[] = ["last-7-days", "last-month", "last-year"];
const QUICK_FILTER_OPTIONS: EventQuickFilter[] = ["my-events", "new-events", "following", "voted", "not-voted"];

/**
 * URL search params = единствен source of truth за филтрите (nuqs).
 * Смяна на филтър обновява URL-а и преизчислява каталога client-side
 * (без нова API заявка).
 */
export function useEventsFilters() {
  return useQueryStates(
    {
      search: parseAsString.withDefault(""),
      location: parseAsString.withDefault(""),
      type: parseAsStringEnum<EventKind>(TYPE_OPTIONS),
      status: parseAsStringEnum<EventStatusFilter>(STATUS_OPTIONS),
      sort: parseAsStringEnum<EventSortOption>(SORT_OPTIONS).withDefault("date-desc"),
      popularity: parseAsStringEnum<EventPopularityFilter>(POPULARITY_OPTIONS),
      datePeriod: parseAsStringEnum<EventDatePeriod>(DATE_PERIOD_OPTIONS),
      quickFilter: parseAsStringEnum<EventQuickFilter>(QUICK_FILTER_OPTIONS),
      page: parseAsInteger.withDefault(0),
    },
    { history: "push" },
  );
}
