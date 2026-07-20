"use client";

import { useQuery } from "@tanstack/react-query";
import { signalsApi } from "../api";
import type { SignalsListParams } from "../types";

/**
 * No infinite scroll — signals are geographically bounded to one region (small
 * dataset), and the map needs every matching signal at once for clustering.
 * The list panel shares this same query (single cache entry per filter set).
 */
export function useSignalsList(params: SignalsListParams) {
  return useQuery({
    queryKey: ["signals", "list", params],
    queryFn: () => signalsApi.list(params),
  });
}
