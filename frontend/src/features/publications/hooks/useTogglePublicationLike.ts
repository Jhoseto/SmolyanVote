"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { publicationsApi } from "../api";
import { patchPublicationCaches } from "../lib/feedCache";

export function useTogglePublicationLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => publicationsApi.like(id),
    onSuccess: (res, id) => {
      patchPublicationCaches(queryClient, id, {
        isLiked: res.isLiked,
        isDisliked: res.isDisliked,
        likesCount: res.likesCount,
        dislikesCount: res.dislikesCount,
      });
    },
  });
}
