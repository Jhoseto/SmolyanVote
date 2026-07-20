"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { messengerApi } from "../api";
import { CONVERSATIONS_QUERY_KEY } from "./useConversations";
import { useMessengerUiStore } from "../store/messengerUiStore";
import type { Conversation } from "../types";

export function useStartConversation() {
  const queryClient = useQueryClient();
  const openChat = useMessengerUiStore((s) => s.openChat);

  return useMutation({
    mutationFn: (otherUserId: number) => messengerApi.startConversation(otherUserId),
    onSuccess: (conversation: Conversation) => {
      queryClient.setQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY, (old) => {
        if (!old) return [conversation];
        if (old.some((c) => c.id === conversation.id)) {
          return old.map((c) => (c.id === conversation.id ? conversation : c));
        }
        return [conversation, ...old];
      });
      openChat(conversation.id);
    },
  });
}
