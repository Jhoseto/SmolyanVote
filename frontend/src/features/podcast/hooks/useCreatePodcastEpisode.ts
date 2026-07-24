"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/shared/hooks/useToast";
import { errorMessage } from "@/shared/lib/errorMessage";
import { podcastApi } from "../api";
import type { CreatePodcastEpisodePayload } from "../types";

/** Admin-only episode upload — invalidates the shared episodes list so the new episode appears instantly. */
export function useCreatePodcastEpisode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePodcastEpisodePayload) => podcastApi.createEpisode(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["podcast", "episodes"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "podcast-episodes"] });
      toast.success("Епизодът е публикуван успешно.");
    },
    onError: (error) => toast.error(errorMessage(error, "Качването се провали. Опитайте отново.")),
  });
}
