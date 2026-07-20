"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eventsApi } from "../api";
import { referendumDetailQueryKey } from "./useReferendumDetail";
import type { CreateReferendumFormValues } from "../schema";

interface UpdateReferendumInput {
  id: number;
  values: CreateReferendumFormValues;
  newImages: File[];
  deleteImageIds: number[];
}

export function useUpdateReferendum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values, newImages, deleteImageIds }: UpdateReferendumInput) =>
      eventsApi.updateReferendum(id, values, newImages, deleteImageIds),
    onSuccess: (detail, { id }) => {
      queryClient.setQueryData(referendumDetailQueryKey(id), detail);
      void queryClient.invalidateQueries({ queryKey: ["events", "catalog"] });
    },
  });
}
