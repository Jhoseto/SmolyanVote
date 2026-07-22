"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signalsApi } from "../api";
import { prependSignalToDataset } from "../lib/signalsCache";

export function useCreateSignal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: signalsApi.create,
    onSuccess: (created) => {
      prependSignalToDataset(queryClient, created);
    },
  });
}
