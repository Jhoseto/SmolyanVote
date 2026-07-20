"use client";

import { useQuery } from "@tanstack/react-query";
import { signalsApi } from "../api";

export function signalDetailQueryKey(id: number) {
  return ["signals", "detail", id] as const;
}

/** `id === null` → disabled (modal closed). Fetch increments `viewsCount` server-side (mirrors legacy). */
export function useSignalDetail(id: number | null) {
  return useQuery({
    queryKey: signalDetailQueryKey(id ?? -1),
    queryFn: () => signalsApi.detail(id as number),
    enabled: id != null,
  });
}
