"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { publicationsApi } from "../api";
import { patchPublicationCaches } from "../lib/feedCache";

export function useTogglePublicationBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => publicationsApi.bookmark(id),
    onSuccess: (res, id) => {
      patchPublicationCaches(queryClient, id, { isBookmarked: res.isBookmarked });
    },
  });
}
