import { apiClient } from "@/lib/api/client";
import type {
  AttachmentUpload,
  CallHistoryItem,
  CallTokenResponse,
  Conversation,
  Message,
  MessagesPage,
  MessengerUser,
  Participant,
  ParticipantRole,
  Poll,
  ReactionSummary,
  TranslateLanguage,
  TranslateResponse,
} from "./types";

/** Thin wrappers over `/api/svmessenger/**` (JWT already wired — MODERN_FRONTEND_PLAN.md Фаза 8). */
export const messengerApi = {
  conversations: () =>
    apiClient.get<Conversation[]>("/api/svmessenger/conversations?includeGroups=true"),

  conversation: (id: number) =>
    apiClient.get<Conversation>(`/api/svmessenger/conversations/${id}`),

  // ---------------------------------------------------------------- групи
  createGroup: (title: string, memberIds: number[], imageUrl?: string | null) =>
    apiClient.post<Conversation>("/api/svmessenger/groups", {
      body: { title, memberIds, imageUrl },
    }),

  updateGroup: (id: number, patch: { title?: string; imageUrl?: string | null }) =>
    apiClient.put<Conversation>(`/api/svmessenger/groups/${id}`, { body: patch }),

  groupParticipants: (id: number) =>
    apiClient.get<Participant[]>(`/api/svmessenger/groups/${id}/participants`),

  addGroupMembers: (id: number, memberIds: number[]) =>
    apiClient.post<Conversation>(`/api/svmessenger/groups/${id}/participants`, {
      body: { memberIds },
    }),

  removeGroupMember: (id: number, userId: number) =>
    apiClient.delete<Conversation>(`/api/svmessenger/groups/${id}/participants/${userId}`),

  leaveGroup: (id: number) =>
    apiClient.post<{ success: boolean }>(`/api/svmessenger/groups/${id}/leave`),

  setGroupRole: (id: number, userId: number, role: ParticipantRole) =>
    apiClient.put<Conversation>(`/api/svmessenger/groups/${id}/participants/${userId}/role`, {
      body: { role },
    }),

  publishE2EKey: (publicJwk: string) =>
    apiClient.put<{ userId: number; publicJwk: string }>("/api/svmessenger/e2e/keys", {
      body: { publicJwk },
    }),

  getE2EKey: (userId: number) =>
    apiClient.get<{ userId: number; publicJwk: string }>(`/api/svmessenger/e2e/keys/${userId}`),

  startConversation: (otherUserId: number, initialMessage?: string) =>
    apiClient.post<Conversation>("/api/svmessenger/conversations/start", {
      body: { otherUserId, initialMessage },
    }),

  markConversationRead: (id: number) =>
    apiClient.put<{ success: boolean }>(`/api/svmessenger/conversations/${id}/read`),

  toggleMute: (id: number) =>
    apiClient.put<{ muted: boolean }>(`/api/svmessenger/conversations/${id}/mute`),

  searchMessages: (query: string, page = 0, size = 20) =>
    apiClient.get<MessagesPage>(
      `/api/svmessenger/messages/search?q=${encodeURIComponent(query)}&page=${page}&size=${size}`,
    ),

  hideConversation: (id: number) =>
    apiClient.put<{ success: boolean }>(`/api/svmessenger/conversations/${id}/hide`),

  messages: (conversationId: number, page = 0, size = 50) =>
    apiClient.get<MessagesPage>(
      `/api/svmessenger/messages/conversation/${conversationId}?page=${page}&size=${size}`,
    ),

  sendMessage: (
    conversationId: number,
    text: string,
    parentMessageId?: number | null,
    attachment?: AttachmentUpload | null,
    messageType: string = "TEXT",
  ) =>
    apiClient.post<Message>("/api/svmessenger/messages/send", {
      body: {
        conversationId,
        text,
        messageType,
        ...(parentMessageId != null ? { parentMessageId } : {}),
        ...(attachment
          ? {
              attachmentUrl: attachment.url,
              attachmentName: attachment.name,
              attachmentSize: attachment.size,
              attachmentMime: attachment.mime,
            }
          : {}),
      },
    }),

  uploadAttachment: (conversationId: number, file: File) => {
    const form = new FormData();
    form.append("file", file);
    form.append("conversationId", String(conversationId));
    return apiClient.postForm<AttachmentUpload>("/api/svmessenger/messages/upload", {
      body: form,
      direct: true,
    });
  },

  createPoll: (conversationId: number, question: string, options: string[]) =>
    apiClient.post<Message>("/api/svmessenger/messages/poll", {
      body: { conversationId, question, options },
    }),

  votePoll: (optionId: number) =>
    apiClient.post<Poll>(`/api/svmessenger/messages/poll/${optionId}/vote`),

  toggleReaction: (messageId: number, emoji: string) =>
    apiClient.post<ReactionSummary[]>(`/api/svmessenger/messages/${messageId}/reactions`, {
      body: { emoji },
    }),

  togglePin: (messageId: number) =>
    apiClient.post<{ active: boolean }>(`/api/svmessenger/messages/${messageId}/pin`),

  toggleStar: (messageId: number) =>
    apiClient.post<{ active: boolean }>(`/api/svmessenger/messages/${messageId}/star`),

  pinnedMessages: (conversationId: number) =>
    apiClient.get<Message[]>(`/api/svmessenger/messages/pinned?conversationId=${conversationId}`),

  starredMessages: () => apiClient.get<Message[]>("/api/svmessenger/messages/starred"),

  forwardMessage: (messageId: number, conversationId: number) =>
    apiClient.post<Message>(`/api/svmessenger/messages/${messageId}/forward`, {
      body: { conversationId },
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
