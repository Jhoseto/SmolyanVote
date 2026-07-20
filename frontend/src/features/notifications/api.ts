import { apiClient } from "@/lib/api/client";
import type { NotificationDto, NotificationPage } from "./types";

/** Thin fetch wrappers over `/api/notifications/**` — no business logic here. */
export const notificationsApi = {
  recent: (limit = 10) =>
    apiClient.get<NotificationDto[]>(`/api/notifications/recent?limit=${limit}`),

  list: (page: number, size = 20) =>
    apiClient.get<NotificationPage>(`/api/notifications?page=${page}&size=${size}`),

  unreadCount: () => apiClient.get<{ count: number }>("/api/notifications/unread-count"),

  markAsRead: (id: number) => apiClient.post<void>(`/api/notifications/${id}/read`),

  markAllAsRead: () => apiClient.post<void>("/api/notifications/read-all"),

  remove: (id: number) => apiClient.delete<void>(`/api/notifications/${id}`),

  removeAll: () => apiClient.delete<void>("/api/notifications/all"),
};
