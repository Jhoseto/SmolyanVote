"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signalsApi, SIGNALS_DATASET_QUERY_KEY } from "../api";
import { patchSignalCaches } from "../lib/signalsCache";
import type { Signal } from "../types";

export function useReportSignalResolved() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => signalsApi.reportResolved(id),
    onSuccess: (updated: Signal) => {
      patchSignalCaches(queryClient, updated.id, {
        hasReportedResolved: updated.hasReportedResolved,
        resolvedReportCount: updated.resolvedReportCount,
      });
      queryClient.setQueryData<Signal[]>(SIGNALS_DATASET_QUERY_KEY, (prev) =>
        prev?.map((s) =>
          s.id === updated.id
            ? {
                ...s,
                hasReportedResolved: updated.hasReportedResolved,
                resolvedReportCount: updated.resolvedReportCount,
              }
            : s,
        ),
      );
    },
  });
}
