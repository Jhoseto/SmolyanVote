"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/shared/hooks/useToast";
import { errorMessage } from "@/shared/lib/errorMessage";
import { publicationsApi } from "../api";
import { patchPublicationCaches } from "../lib/feedCache";

export function useSharePublication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => publicationsApi.share(id),
    onSuccess: (res, id) => {
      patchPublicationCaches(queryClient, id, { sharesCount: res.sharesCount });
    },
    onError: (error) => toast.error(errorMessage(error, "Споделянето не бе записано.")),
  });
}
