"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eventsApi } from "../api";
import { multiPollDetailQueryKey } from "./useMultiPollDetail";
import type { CreateMultiPollFormValues } from "../schema";

interface UpdateMultiPollInput {
  id: number;
  values: CreateMultiPollFormValues;
  newImages: File[];
  deleteImageIds: number[];
}

export function useUpdateMultiPoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values, newImages, deleteImageIds }: UpdateMultiPollInput) =>
      eventsApi.updateMultiPoll(id, values, newImages, deleteImageIds),
    onSuccess: (detail, { id }) => {
      queryClient.setQueryData(multiPollDetailQueryKey(id), detail);
      void queryClient.invalidateQueries({ queryKey: multiPollDetailQueryKey(id) });
      void queryClient.invalidateQueries({ queryKey: ["events", "catalog"] });
    },
  });
}
