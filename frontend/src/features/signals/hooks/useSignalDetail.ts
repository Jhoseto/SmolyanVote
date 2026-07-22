"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { signalsApi, SIGNALS_DATASET_QUERY_KEY } from "../api";
import { shouldRecordSignalView } from "../lib/dedupeView";
import { patchSignalCaches } from "../lib/signalsCache";
import type { Signal } from "../types";

export function signalDetailQueryKey(id: number) {
  return ["signals", "detail", id] as const;
}

function signalFromDataset(queryClient: ReturnType<typeof useQueryClient>, id: number): Signal | undefined {
  return queryClient.getQueryData<Signal[]>(SIGNALS_DATASET_QUERY_KEY)?.find((s) => s.id === id);
}

/** Uses dataset cache as placeholder; records view once per session. */
export function useSignalDetail(id: number | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: signalDetailQueryKey(id ?? -1),
    queryFn: () => signalsApi.detail(id as number),
    enabled: id != null,
    placeholderData: id != null ? () => signalFromDataset(queryClient, id) : undefined,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (id == null) return;
    if (!shouldRecordSignalView(id)) return;
    signalsApi.recordView(id).then((res) => {
      patchSignalCaches(queryClient, id, { viewsCount: res.viewsCount });
    }).catch(() => {
      /* non-blocking */
    });
  }, [id, queryClient]);

  return query;
}
