"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { stompClient } from "@/lib/realtime/stompClient";
import { messengerApi } from "../api";
import { upsertMessage, patchConversationPreview } from "../lib/cacheUpdates";
import type { Message } from "../types";

export function useSendMessage(conversationId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ text, parentMessageId }: { text: string; parentMessageId?: number | null }) => {
      if (stompClient.connected) {
        stompClient.publish("/app/svmessenger/send", {
          conversationId,
          text,
          messageType: "TEXT",
          ...(parentMessageId != null ? { parentMessageId } : {}),
        });
        return null;
      }
      return messengerApi.sendMessage(conversationId, text, parentMessageId);
    },
    onSuccess: (message: Message | null) => {
      if (!message) return;
      upsertMessage(queryClient, message);
      patchConversationPreview(queryClient, conversationId, {
        lastMessage: message.text,
        lastMessageTime: message.sentAt,
        unreadCount: 0,
      });
    },
  });
}
