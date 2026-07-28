"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/shared/hooks/useToast";
import { messengerApi } from "../api";
import { patchConversationPreview } from "../lib/cacheUpdates";

export function useToggleMute() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (conversationId: number) => messengerApi.toggleMute(conversationId),
    onSuccess: ({ muted }, conversationId) => {
      patchConversationPreview(queryClient, conversationId, { isMuted: muted });
      toast.success(muted ? "Разговорът е заглушен." : "Известията са включени.");
    },
    onError: () => toast.error("Действието не успя."),
  });
}
