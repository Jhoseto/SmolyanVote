import { apiClient } from "@/lib/api/client";
import type {
  CallHistoryItem,
  CallTokenResponse,
  Conversation,
  Message,
  MessagesPage,
  MessengerUser,
  TranslateLanguage,
  TranslateResponse,
} from "./types";

/** Thin wrappers over `/api/svmessenger/**` (JWT already wired — MODERN_FRONTEND_PLAN.md Фаза 8). */
export const messengerApi = {
  conversations: () => apiClient.get<Conversation[]>("/api/svmessenger/conversations"),

  conversation: (id: number) =>
    apiClient.get<Conversation>(`/api/svmessenger/conversations/${id}`),

  startConversation: (otherUserId: number, initialMessage?: string) =>
    apiClient.post<Conversation>("/api/svmessenger/conversations/start", {
      body: { otherUserId, initialMessage },
    }),

  markConversationRead: (id: number) =>
    apiClient.put<{ success: boolean }>(`/api/svmessenger/conversations/${id}/read`),

  hideConversation: (id: number) =>
    apiClient.put<{ success: boolean }>(`/api/svmessenger/conversations/${id}/hide`),

  messages: (conversationId: number, page = 0, size = 50) =>
    apiClient.get<MessagesPage>(
      `/api/svmessenger/messages/conversation/${conversationId}?page=${page}&size=${size}`,
    ),

  sendMessage: (conversationId: number, text: string, parentMessageId?: number | null) =>
    apiClient.post<Message>("/api/svmessenger/messages/send", {
      body: {
        conversationId,
        text,
        messageType: "TEXT",
        ...(parentMessageId != null ? { parentMessageId } : {}),
      },
    }),

  editMessage: (id: number, newText: string) =>
    apiClient.put<Message>(`/api/svmessenger/messages/${id}/edit`, {
      body: { newText },
    }),

  deleteMessage: (id: number) =>
    apiClient.delete<{ success: boolean }>(`/api/svmessenger/messages/${id}`),

  markDelivered: () =>
    apiClient.put<{ success: boolean }>("/api/svmessenger/messages/delivered"),

  unreadCount: () => apiClient.get<{ count: number }>("/api/svmessenger/unread-count"),

  searchUsers: (query: string) =>
    apiClient.get<MessengerUser[]>(
      `/api/svmessenger/users/search?query=${encodeURIComponent(query)}`,
    ),

  followingUsers: (query?: string) => {
    const q = query?.trim() ? `?query=${encodeURIComponent(query.trim())}` : "";
    return apiClient.get<MessengerUser[]>(`/api/svmessenger/users/following${q}`);
  },

  typing: (conversationId: number, isTyping: boolean) =>
    apiClient.post<{ success: boolean }>("/api/svmessenger/typing", {
      body: { conversationId, isTyping },
    }),

  translateAndSave: (messageId: number, targetLanguage: TranslateLanguage) =>
    apiClient.post<TranslateResponse>("/api/svmessenger/translate-and-save", {
      body: { messageId, targetLanguage },
    }),

  getCallToken: (conversationId: number, otherUserId: number) =>
    apiClient.post<CallTokenResponse>("/api/svmessenger/call/token", {
      body: { conversationId, otherUserId },
    }),

  callHistory: (conversationId: number) =>
    apiClient.get<CallHistoryItem[]>(
      `/api/svmessenger/conversations/${conversationId}/call-history`,
    ),
};
