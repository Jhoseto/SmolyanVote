"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signalsApi } from "../api";
import type { Signal } from "../types";

export function useCreateSignal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: signalsApi.create,
    onSuccess: (created) => {
      queryClient.setQueriesData<Signal[]>({ queryKey: ["signals", "list"] }, (data) =>
        data ? [created, ...data] : data,
      );
    },
  });
}
