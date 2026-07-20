"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eventsApi } from "../api";
import type { CreateMultiPollFormValues } from "../schema";

export function useCreateMultiPoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ values, images }: { values: CreateMultiPollFormValues; images: File[] }) =>
      eventsApi.createMultiPoll(values, images),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["events", "catalog"] });
    },
  });
}
