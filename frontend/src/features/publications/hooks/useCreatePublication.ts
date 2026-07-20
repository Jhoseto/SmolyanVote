"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { publicationsApi } from "../api";
import type { CreatePublicationPayload } from "../types";

export function useCreatePublication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePublicationPayload) => publicationsApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["publications", "feed"] });
    },
  });
}
