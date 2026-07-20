import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import { CONVERSATIONS_QUERY_KEY } from "../hooks/useConversations";
import { messagesQueryKey } from "../hooks/useMessages";
import { UNREAD_COUNT_QUERY_KEY } from "../hooks/useUnreadCount";
import type { Conversation, Message, MessagesPage } from "../types";

/** Upsert a message into page 0 of the infinite messages cache (newest-first pages). */
export function upsertMessage(queryClient: QueryClient, message: Message): void {
  queryClient.setQueryData<InfiniteData<MessagesPage>>(messagesQueryKey(message.conversationId), (old) => {
    if (!old) {
      return {
        pages: [
          {
            content: [message],
            number: 0,
            size: 50,
            totalElements: 1,
            totalPages: 1,
            last: true,
            first: true,
          },
        ],
        pageParams: [0],
      };
    }

    const exists = old.pages.some((p) => p.content.some((m) => m.id === message.id));
    if (exists) {
      return {
        ...old,
        pages: old.pages.map((p) => ({
          ...p,
          content: p.content.map((m) => (m.id === message.id ? { ...m, ...message } : m)),
        })),
      };
    }

    const [first, ...rest] = old.pages;
    if (!first) return old;
    return {
      ...old,
      pages: [{ ...first, content: [message, ...first.content] }, ...rest],
    };
  });
}

export function patchConversationPreview(
  queryClient: QueryClient,
  conversationId: number,
  patch: Partial<Conversation>,
): void {
  queryClient.setQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY, (old) => {
    if (!old) return old;
    const next = old.map((c) => (c.id === conversationId ? { ...c, ...patch } : c));
    // Bump updated conversation to top when lastMessageTime changes.
    if (patch.lastMessageTime) {
      next.sort((a, b) => {
        const ta = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
        const tb = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
        return tb - ta;
      });
    }
    return next;
  });
}

export function bumpUnreadTotal(queryClient: QueryClient, delta: number): void {
  queryClient.setQueryData<number>(UNREAD_COUNT_QUERY_KEY, (old) => Math.max(0, (old ?? 0) + delta));
}

export function setUnreadTotal(queryClient: QueryClient, count: number): void {
  queryClient.setQueryData<number>(UNREAD_COUNT_QUERY_KEY, count);
}

export function applyReadReceipt(
  queryClient: QueryClient,
  conversationId: number,
  messageId: number | undefined,
  readAt: string,
): void {
  queryClient.setQueryData<InfiniteData<MessagesPage>>(messagesQueryKey(conversationId), (old) => {
    if (!old) return old;
    return {
      ...old,
      pages: old.pages.map((p) => ({
        ...p,
        content: p.content.map((m) => {
          if (messageId != null) {
            return m.id === messageId ? { ...m, isRead: true, readAt } : m;
          }
          // BULK_READ — mark all own outbound as read (we don't know sender here; mark all unread→read)
          return m.isRead ? m : { ...m, isRead: true, readAt };
        }),
      })),
    };
  });
}

export function applyDeliveryReceipt(
  queryClient: QueryClient,
  conversationId: number,
  messageId: number | undefined,
  deliveredAt: string,
): void {
  queryClient.setQueryData<InfiniteData<MessagesPage>>(messagesQueryKey(conversationId), (old) => {
    if (!old) return old;
    return {
      ...old,
      pages: old.pages.map((p) => ({
        ...p,
        content: p.content.map((m) => {
          if (messageId != null) {
            return m.id === messageId ? { ...m, isDelivered: true, deliveredAt } : m;
          }
          return m.isDelivered ? m : { ...m, isDelivered: true, deliveredAt };
        }),
      })),
    };
  });
}
