"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signalsApi } from "../api";
import { patchSignalCaches } from "../lib/signalsCache";

export function useToggleSignalBoost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => signalsApi.boost(id),
    onSuccess: (result, id) => {
      patchSignalCaches(queryClient, id, {
        hasBoosted: result.hasBoosted,
        priorityBoostCount: result.priorityBoostCount,
      });
    },
  });
}
