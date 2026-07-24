"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/shared/hooks/useToast";
import { errorMessage } from "@/shared/lib/errorMessage";
import { publicationsApi } from "../api";
import { patchPublicationCaches } from "../lib/feedCache";

export function useTogglePublicationBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => publicationsApi.bookmark(id),
    onSuccess: (res, id) => {
      patchPublicationCaches(queryClient, id, { isBookmarked: res.isBookmarked });
      if (res.isBookmarked) {
        toast.success("Публикацията е запазена в отметките.");
      } else {
        toast.info("Премахнато от отметките.");
      }
    },
    onError: (error) => toast.error(errorMessage(error, "Отметката не бе успешна.")),
  });
}
