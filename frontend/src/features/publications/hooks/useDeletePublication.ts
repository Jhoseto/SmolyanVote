"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { publicationsApi } from "../api";
import { removePublicationFromFeedCache } from "../lib/feedCache";

export function useDeletePublication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => publicationsApi.remove(id),
    onSuccess: (_res, id) => {
      removePublicationFromFeedCache(queryClient, id);
    },
  });
}
