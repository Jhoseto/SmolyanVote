"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eventsApi } from "../api";
import { simpleEventDetailQueryKey } from "./useSimpleEventDetail";
import type { CreateSimpleEventFormValues } from "../schema";

interface UpdateSimpleEventInput {
  id: number;
  values: CreateSimpleEventFormValues;
  newImages: File[];
  deleteImageIds: number[];
}

export function useUpdateSimpleEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values, newImages, deleteImageIds }: UpdateSimpleEventInput) =>
      eventsApi.updateSimpleEvent(id, values, newImages, deleteImageIds),
    onSuccess: (detail, { id }) => {
      queryClient.setQueryData(simpleEventDetailQueryKey(id), detail);
      void queryClient.invalidateQueries({ queryKey: ["events", "catalog"] });
    },
  });
}
