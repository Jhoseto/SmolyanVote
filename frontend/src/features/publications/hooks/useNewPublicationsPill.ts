"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { publicationsApi } from "../api";
import type { PublicationsListParams } from "../types";

/**
 * Polls the first page quietly; when a newer top post appears, exposes
 * `newCount` + `refresh()` that invalidates the feed cache.
 */
export function useNewPublicationsPill(
  filters: Omit<PublicationsListParams, "page" | "size">,
  enabled: boolean,
) {
  const queryClient = useQueryClient();
  const baselineId = useRef<number | null>(null);
  const [newCount, setNewCount] = useState(0);

  const poll = useQuery({
    queryKey: ["publications", "new-pill", filters],
    enabled,
    refetchInterval: enabled ? 45_000 : false,
    refetchIntervalInBackground: false,
    queryFn: () => publicationsApi.list({ ...filters, page: 0, size: 5 }),
  });

  useEffect(() => {
    const top = poll.data?.content?.[0];
    if (!top) return;
    if (baselineId.current == null) {
      baselineId.current = top.id;
      return;
    }
    if (top.id !== baselineId.current) {
      const newer = poll.data?.content.filter((p) => p.id > (baselineId.current ?? 0)).length ?? 0;
      setNewCount(Math.max(newer, 1));
    }
  }, [poll.data]);

  // Reset baseline when filters change.
  useEffect(() => {
    baselineId.current = null;
    setNewCount(0);
  }, [filters.search, filters.category, filters.time, filters.sort, filters.userIds, filters.author]);

  function refresh() {
    const top = poll.data?.content?.[0];
    if (top) baselineId.current = top.id;
    setNewCount(0);
    void queryClient.invalidateQueries({ queryKey: ["publications", "feed"] });
  }

  return { newCount, refresh };
}
