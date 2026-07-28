"use client";

import { useMemo } from "react";
import { useAuth } from "@/shared/lib/authContext";
import { applyPriorityTiers } from "../lib/computePriorityLevel";
import { filterSignals } from "../lib/filterSignals";
import { sortSignals } from "../lib/sortSignals";
import { useGeolocation } from "./useGeolocation";
import type { Signal, SignalCategory, SignalSortOption, SignalTimeFilter } from "../types";

export interface DerivedSignalsParams {
  search?: string;
  category?: SignalCategory | null;
  showInactive?: boolean;
  sort?: SignalSortOption;
  time?: SignalTimeFilter;
  mineOnly?: boolean;
  boostedOnly?: boolean;
  highPriorityOnly?: boolean;
  resolvedOnly?: boolean;
  nearMe?: boolean;
}

export function useDerivedSignals(dataset: Signal[] | undefined, params: DerivedSignalsParams) {
  const { user } = useAuth();
  const geo = useGeolocation(params.nearMe ?? false);

  return useMemo(() => {
    if (!dataset) return [];
    const withTiers = applyPriorityTiers(dataset);
    const effectiveSort =
      params.nearMe && geo.coords && (params.sort === "newest" || !params.sort) ? "distance" : (params.sort ?? "newest");
    const filtered = filterSignals(withTiers, {
      search: params.search,
      category: params.category,
      showInactive: params.showInactive,
      time: params.time,
      mineOnly: params.mineOnly,
      boostedOnly: params.boostedOnly,
      highPriorityOnly: params.highPriorityOnly,
      resolvedOnly: params.resolvedOnly,
      nearMe: params.nearMe,
      userCoords: geo.coords,
      currentUserId: user?.id ?? null,
    });
    return sortSignals(filtered, effectiveSort);
  }, [dataset, params, user?.id, geo.coords]);
}
