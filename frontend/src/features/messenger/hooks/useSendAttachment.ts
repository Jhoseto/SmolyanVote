"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/shared/lib/authContext";
import { messengerApi } from "../api";
import {
  insertOptimisticMessage,
  markOptimisticFailed,
  patchConversationPreview,
  removeOptimisticMessage,
  upsertMessage,
} from "../lib/cacheUpdates";
import type { Message } from "../types";

export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;

export function attachmentMessageType(mime: string): "IMAGE" | "AUDIO" | "FILE" {
  if (mime.startsWith("image/")) return "IMAGE";
  if (mime.startsWith("audio/")) return "AUDIO";
  return "FILE";
}

interface SendAttachmentVariables {
  file: File;
  text?: string;
  parentMessageId?: number | null;
}

/**
 * Upload → send in one mutation, with a placeholder bubble in between so the
 * image shows up locally the moment it is dropped.
 */
export function useSendAttachment(conversationId: number) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ file, text, parentMessageId }: SendAttachmentVariables) => {
      const uploaded = await messengerApi.uploadAttachment(conversationId, file);
      return messengerApi.sendMessage(
        conversationId,
        text ?? "",
        parentMessageId ?? null,
        uploaded,
        attachmentMessageType(file.type || ""),
      );
    },

    onMutate: ({ file, text, parentMessageId }: SendAttachmentVariables) => {
      if (!user) return undefined;
      const clientId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const isImage = file.type.startsWith("image/");
      const optimistic: Message = {
        id: -Date.now(),
        conversationId,
        senderId: user.id,
        senderUsername: user.username,
        senderImageUrl: user.imageUrl ?? null,
        text: text ?? "",
        sentAt: new Date().toISOString(),
        isDelivered: false,
        deliveredAt: null,
        isRead: false,
        readAt: null,
        messageType: attachmentMessageType(file.type || ""),
        isEdited: false,
        editedAt: null,
        parentMessageId: parentMessageId ?? null,
        parentMessageText: null,
        attachmentUrl: null,
        attachmentName: file.name,
        attachmentSize: file.size,
        attachmentMime: file.type,
        clientId,
        sendState: "pending",
        localPreviewUrl: isImage ? URL.createObjectURL(file) : undefined,
      };
      insertOptimisticMessage(queryClient, optimistic);
      return { clientId, previewUrl: optimistic.localPreviewUrl };
    },

    onSuccess: (message, _variables, context) => {
      if (context?.clientId) removeOptimisticMessage(queryClient, conversationId, context.clientId);
      if (context?.previewUrl) URL.revokeObjectURL(context.previewUrl);
      upsertMessage(queryClient, message);
      patchConversationPreview(queryClient, conversationId, {
        lastMessage: message.text || message.attachmentName || "Прикачен файл",
        lastMessageTime: message.sentAt,
        unreadCount: 0,
      });
    },

    onError: (_error, _variables, context) => {
      if (context?.clientId) markOptimisticFailed(queryClient, conversationId, context.clientId);
    },
  });
}
