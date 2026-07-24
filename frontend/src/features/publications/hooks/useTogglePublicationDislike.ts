"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/shared/hooks/useToast";
import { errorMessage } from "@/shared/lib/errorMessage";
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
    onError: (error) => toast.error(errorMessage(error, "Реакцията не бе успешна.")),
  });
}
