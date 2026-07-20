"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eventsApi } from "../api";
import type { CreateSimpleEventFormValues } from "../schema";

export function useCreateSimpleEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ values, images }: { values: CreateSimpleEventFormValues; images: File[] }) =>
      eventsApi.createSimpleEvent(values, images),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["events", "catalog"] });
    },
  });
}
