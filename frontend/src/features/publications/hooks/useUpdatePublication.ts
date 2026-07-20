"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { publicationsApi } from "../api";
import { patchPublicationCaches } from "../lib/feedCache";
import type { CreatePublicationPayload } from "../types";

export function useUpdatePublication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CreatePublicationPayload }) =>
      publicationsApi.update(id, payload),
    onSuccess: (updated, { id }) => {
      patchPublicationCaches(queryClient, id, updated);
    },
  });
}
