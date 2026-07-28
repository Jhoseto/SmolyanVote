"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { stompClient } from "@/lib/realtime/stompClient";
import { useAuth } from "@/shared/lib/authContext";
import { messengerApi } from "../api";
import {
  insertOptimisticMessage,
  markOptimisticFailed,
  patchConversationPreview,
  upsertMessage,
} from "../lib/cacheUpdates";
import { encryptForPeer } from "../lib/e2eCrypto";
import { CONVERSATIONS_QUERY_KEY } from "./useConversations";
import { e2eKeyQueryKey } from "./useE2EKeys";
import type { Conversation, Message } from "../types";

interface SendVariables {
  text: string;
  parentMessageId?: number | null;
}

export function useSendMessage(conversationId: number) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ text, parentMessageId }: SendVariables) => {
      let outbound = text;
      const list = queryClient.getQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY);
      const conversation = list?.find((c) => c.id === conversationId);
      const peerId = conversation?.type !== "GROUP" ? conversation?.otherUser?.id : undefined;

      if (peerId != null) {
        const peerKey = queryClient.getQueryData<{ publicJwk: string }>(e2eKeyQueryKey(peerId));
        if (peerKey?.publicJwk) {
          try {
            outbound = await encryptForPeer(text, peerKey.publicJwk);
          } catch {
            /* fall back to plaintext if crypto fails on this device */
          }
        } else {
          try {
            const fetched = await messengerApi.getE2EKey(peerId);
            queryClient.setQueryData(e2eKeyQueryKey(peerId), fetched);
            outbound = await encryptForPeer(text, fetched.publicJwk);
          } catch {
            /* peer has no key yet — send plaintext */
          }
        }
      }

      if (stompClient.connected) {
        stompClient.publish("/app/svmessenger/send", {
          conversationId,
          text: outbound,
          messageType: "TEXT",
          ...(parentMessageId != null ? { parentMessageId } : {}),
        });
        return null;
      }
      return messengerApi.sendMessage(conversationId, outbound, parentMessageId);
    },

    onMutate: ({ text, parentMessageId }: SendVariables) => {
      if (!user) return undefined;
      const clientId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const optimistic: Message = {
        id: -Date.now(),
        conversationId,
        senderId: user.id,
        senderUsername: user.username,
        senderImageUrl: user.imageUrl ?? null,
        text,
        sentAt: new Date().toISOString(),
        isDelivered: false,
        deliveredAt: null,
        isRead: false,
        readAt: null,
        messageType: "TEXT",
        isEdited: false,
        editedAt: null,
        parentMessageId: parentMessageId ?? null,
        parentMessageText: null,
        clientId,
        sendState: "pending",
      };
      insertOptimisticMessage(queryClient, optimistic);
      patchConversationPreview(queryClient, conversationId, {
        lastMessage: text,
        lastMessageTime: optimistic.sentAt,
      });
      return { clientId };
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

    onError: (_error, _variables, context) => {
      if (context?.clientId) markOptimisticFailed(queryClient, conversationId, context.clientId);
    },
  });
}
