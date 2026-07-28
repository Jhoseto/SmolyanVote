"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/shared/hooks/useToast";
import { errorMessage } from "@/shared/lib/errorMessage";
import { signalsApi } from "../api";
import { patchSignalCaches } from "../lib/signalsCache";

export function useSetSignalResolved() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, markResolved }: { id: number; markResolved: boolean }) =>
      signalsApi.setResolved(id, markResolved),
    onSuccess: (updated) => {
      patchSignalCaches(queryClient, updated.id, updated);
      toast.success(updated.isResolved ? "Сигналът е маркиран като решен." : "Сигналът е маркиран като нерешен.");
    },
    onError: (err) => toast.error(errorMessage(err, "Промяната на статуса не успя.")),
  });
}
