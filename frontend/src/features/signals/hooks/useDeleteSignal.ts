"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signalsApi } from "../api";
import { removeSignalFromCaches } from "../lib/signalsCache";

export function useDeleteSignal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => signalsApi.remove(id),
    onSuccess: (_, id) => removeSignalFromCaches(queryClient, id),
  });
}
