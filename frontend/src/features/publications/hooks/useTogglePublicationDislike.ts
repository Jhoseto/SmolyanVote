"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { publicationsApi } from "../api";
import { patchPublicationCaches } from "../lib/feedCache";

export function useTogglePublicationDislike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => publicationsApi.dislike(id),
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
