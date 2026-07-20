"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { publicationsApi } from "../api";
import { patchPublicationCaches } from "../lib/feedCache";

export function useSharePublication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => publicationsApi.share(id),
    onSuccess: (res, id) => {
      patchPublicationCaches(queryClient, id, { sharesCount: res.sharesCount });
    },
  });
}
