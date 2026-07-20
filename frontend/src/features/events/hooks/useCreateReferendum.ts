"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eventsApi } from "../api";
import type { CreateReferendumFormValues } from "../schema";

export function useCreateReferendum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ values, images }: { values: CreateReferendumFormValues; images: File[] }) =>
      eventsApi.createReferendum(values, images),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["events", "catalog"] });
    },
  });
}
