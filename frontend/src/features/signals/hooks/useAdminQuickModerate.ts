"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/shared/hooks/useToast";
import { errorMessage } from "@/shared/lib/errorMessage";
import { signalsApi } from "../api";
import { patchSignalCaches } from "../lib/signalsCache";

export function useAdminQuickModerate() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => signalsApi.moderate(id, { markResolved: true }),
    onSuccess: (updated) => {
      patchSignalCaches(queryClient, updated.id, updated);
      toast.success("Сигналът е маркиран като решен.");
    },
    onError: (err) => toast.error(errorMessage(err, "Модерацията не успя.")),
  });
}
