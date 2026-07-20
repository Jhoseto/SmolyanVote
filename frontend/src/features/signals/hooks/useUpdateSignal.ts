"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signalsApi } from "../api";
import { patchSignalCaches } from "../lib/signalsCache";
import type { UpdateSignalPayload } from "../types";

export function useUpdateSignal(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateSignalPayload) => signalsApi.update(id, payload),
    onSuccess: (updated) => patchSignalCaches(queryClient, id, updated),
  });
}
