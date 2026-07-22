"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signalsApi, SIGNALS_DATASET_QUERY_KEY } from "../api";
import { patchSignalCaches } from "../lib/signalsCache";
import type { Signal } from "../types";

export function useSignalSubscribe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, subscribe }: { id: number; subscribe: boolean }) =>
      subscribe ? signalsApi.subscribe(id) : signalsApi.unsubscribe(id),
    onSuccess: (updated: Signal) => {
      patchSignalCaches(queryClient, updated.id, {
        isSubscribed: updated.isSubscribed,
      });
      queryClient.setQueryData<Signal[]>(SIGNALS_DATASET_QUERY_KEY, (prev) =>
        prev?.map((s) => (s.id === updated.id ? { ...s, isSubscribed: updated.isSubscribed } : s)),
      );
    },
  });
}
