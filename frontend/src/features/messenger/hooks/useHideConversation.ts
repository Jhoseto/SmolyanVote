"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { messengerApi } from "../api";
import { CONVERSATIONS_QUERY_KEY } from "./useConversations";
import { useMessengerUiStore } from "../store/messengerUiStore";
import type { Conversation } from "../types";

export function useHideConversation() {
  const queryClient = useQueryClient();
  const closeChat = useMessengerUiStore((s) => s.closeChat);

  return useMutation({
    mutationFn: (id: number) => messengerApi.hideConversation(id),
    onSuccess: (_res, id) => {
      queryClient.setQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY, (old) =>
        old ? old.filter((c) => c.id !== id) : old,
      );
      closeChat(id);
    },
  });
}
