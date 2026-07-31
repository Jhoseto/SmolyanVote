"use client";

import { useMemo, useState } from "react";
import type { MonitorFeedItem } from "../types";
import {
  collectCategories,
  collectRiskFlags,
  countActiveMonitorFilters,
  DEFAULT_MONITOR_LIST_FILTERS,
  filterAndSortMonitorItems,
  type MonitorListFilters,
} from "../lib/listFilters";

export function useMonitorListFilters(items: MonitorFeedItem[], initial?: Partial<MonitorListFilters>) {
  const [filters, setFilters] = useState<MonitorListFilters>({
    ...DEFAULT_MONITOR_LIST_FILTERS,
    ...initial,
  });

  const categories = useMemo(() => collectCategories(items), [items]);
  const riskFlags = useMemo(() => collectRiskFlags(items), [items]);
  const filtered = useMemo(() => filterAndSortMonitorItems(items, filters), [items, filters]);
  const activeCount = useMemo(() => countActiveMonitorFilters(filters), [filters]);

  const patch = (next: Partial<MonitorListFilters>) => setFilters((prev) => ({ ...prev, ...next }));
  const reset = () => setFilters(DEFAULT_MONITOR_LIST_FILTERS);

  return {
    filters,
    patch,
    reset,
    filtered,
    categories,
    riskFlags,
    activeCount,
    totalCount: items.length,
  };
}
