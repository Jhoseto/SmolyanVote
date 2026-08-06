import { resolveApiUrl } from "@/config/env";
import { apiClient } from "@/lib/api/client";
import { tokenStore } from "@/lib/api/tokenStore";
import type {
  ActivitiesResponse,
  ActivityItem,
  ActivityStats,
  AdminDashboardData,
  AdminEventRow,
  AdminOverview,
  AdminPodcastEpisode,
  AdminUser,
  AdminUsersResponse,
  BanHistoryItem,
  BulkResult,
  GroupedReport,
  HealthAlert,
  MetricMap,
  ModerationInboxItem,
  PageResponse,
  ReportDetail,
  ReportStatistics,
  StrikeStatistics,
  UserStatistics,
  ProfanityWord,
} from "./types";

async function getMap(path: string): Promise<MetricMap> {
  return apiClient.get<MetricMap>(path);
}

export const adminApi = {
  overview: () => apiClient.get<AdminOverview>("/admin/api/overview"),

  healthAlerts: () =>
    apiClient.get<{ alerts: HealthAlert[]; criticalCount: number; warningCount: number }>(
      "/admin/api/health-alerts",
    ),

  async dashboard(): Promise<AdminDashboardData> {
    const [aggregate, cloudinary, email, httpStatus, responseTime, memory, recentErrors] =
      await Promise.all([
        apiClient.get<AdminDashboardData["aggregate"]>("/admin/api/dashboard-data"),
        getMap("/admin/api/health/cloudinary"),
        getMap("/admin/api/health/email"),
        getMap("/admin/api/metrics/http-status"),
        getMap("/admin/api/metrics/response-time"),
        getMap("/admin/api/resources/memory"),
        getMap("/admin/api/errors/recent"),
      ]);
    return { aggregate, cloudinary, email, httpStatus, responseTime, memory, recentErrors };
  },

  userStatistics: () => apiClient.get<UserStatistics>("/admin/users/statistics"),

  users: (params?: {
    page?: number;
    size?: number;
    search?: string;
    role?: string;
    status?: string;
    minStrikes?: number;
  }) => {
    const qs = new URLSearchParams();
    qs.set("page", String(params?.page ?? 0));
    qs.set("size", String(params?.size ?? 20));
    if (params?.search?.trim()) qs.set("search", params.search.trim());
    if (params?.role && params.role !== "ALL") qs.set("role", params.role);
    if (params?.status && params.status !== "ALL") qs.set("status", params.status);
    if (params?.minStrikes != null && params.minStrikes > 0) {
      qs.set("minStrikes", String(params.minStrikes));
    }
    return apiClient.get<AdminUsersResponse>(`/admin/users?${qs.toString()}`);
  },

  strikeStatistics: () => apiClient.get<StrikeStatistics>("/admin/users/strikes/statistics"),

  bulkResetStrikes: (userIds: number[]) =>
    apiClient.post<BulkResult>("/admin/users/strikes/bulk-reset", { body: { userIds } }),

  user: (id: number) => apiClient.get<AdminUser>(`/admin/users/${id}`),

  banUser: (id: number, body: { reason: string; banType: string; durationDays?: number; durationHours?: number }) =>
    apiClient.post<{ message?: string; error?: string }>(`/admin/users/${id}/ban`, { body }),

  unbanUser: (id: number) =>
    apiClient.post<{ message?: string; error?: string }>(`/admin/users/${id}/unban`),

  changeRole: (id: number, body: { role: string; reason: string }) =>
    apiClient.post<{ message?: string; error?: string }>(`/admin/users/${id}/role`, { body }),

  changePassword: (id: number, body: { password: string; confirmPassword: string; reason: string }) =>
    apiClient.post<{ message?: string; error?: string }>(`/admin/users/${id}/password`, { body }),

  activateUser: (id: number) =>
    apiClient.post<{ message?: string; error?: string }>(`/admin/users/${id}/activate`),

  deleteUser: (id: number) =>
    apiClient.delete<{ message?: string; error?: string }>(`/admin/users/${id}`),

  resetModerationStrikes: (id: number) =>
    apiClient.post<{ message?: string; error?: string }>(`/admin/users/${id}/reset-strikes`),

  bulkRoleChange: (userIds: number[], newRole: string) =>
    apiClient.post<BulkResult>("/admin/users/bulk-role-change", {
      body: { userIds, newRole },
    }),

  bulkBan: (body: {
    userIds: number[];
    banType: string;
    reason: string;
    durationDays?: number;
    durationHours?: number;
  }) => apiClient.post<BulkResult>("/admin/users/bulk-ban", { body }),

  bulkActivate: (userIds: number[]) =>
    apiClient.post<BulkResult>("/admin/users/bulk-activate", { body: { userIds } }),

  bulkDeleteUsers: (userIds: number[]) =>
    apiClient.post<BulkResult>("/admin/users/bulk-delete", { body: { userIds } }),

  history: () => apiClient.get<BanHistoryItem[]>("/admin/users/history"),

  userHistory: (username: string) =>
    apiClient.get<BanHistoryItem[]>(`/admin/users/${encodeURIComponent(username)}/history`),

  reportStatistics: () =>
    apiClient.get<ReportStatistics>("/admin/manage-reports/statistics"),

  groupedReports: (params?: {
    page?: number;
    size?: number;
    entityType?: string;
    pendingOnly?: boolean;
    status?: string;
  }) => {
    const qs = new URLSearchParams();
    qs.set("page", String(params?.page ?? 0));
    qs.set("size", String(params?.size ?? 50));
    if (params?.entityType && params.entityType !== "ALL") qs.set("entityType", params.entityType);
    if (params?.pendingOnly) qs.set("pendingOnly", "true");
    if (params?.status && params.status !== "ALL") qs.set("status", params.status);
    return apiClient.get<PageResponse<GroupedReport>>(
      `/admin/manage-reports/grouped?${qs.toString()}`,
    );
  },

  entityAction: (body: {
    entityType: string;
    entityId: number;
    action?: "DELETE" | "DISMISS" | "RESOLVE_SIGNAL";
    adminNotes?: string;
    banAuthor?: boolean;
    banReason?: string;
  }) =>
    apiClient.post<{ success?: boolean; message?: string; error?: string }>(
      "/admin/manage-reports/entity-action",
      { body },
    ),

  moderationInbox: (params?: {
    page?: number;
    size?: number;
    entityType?: string;
    pendingOnly?: boolean;
    status?: string;
  }) => {
    const qs = new URLSearchParams();
    qs.set("page", String(params?.page ?? 0));
    qs.set("size", String(params?.size ?? 20));
    if (params?.entityType && params.entityType !== "ALL") qs.set("entityType", params.entityType);
    if (params?.pendingOnly) qs.set("pendingOnly", "true");
    if (params?.status && params.status !== "ALL") qs.set("status", params.status);
    return apiClient.get<{
      items: ModerationInboxItem[];
      page: number;
      size: number;
      totalElements: number;
      totalPages: number;
    }>(`/admin/moderation/inbox?${qs.toString()}`);
  },

  bulkReview: (body: {
    entityGroups: { entityType: string; entityId: number }[];
    status: string;
    adminNotes?: string;
  }) =>
    apiClient.post<{ message?: string }>("/admin/manage-reports/grouped/bulk-review", { body }),

  bulkDeleteReports: (reportIds: number[]) =>
    apiClient.post<{ message?: string }>("/admin/manage-reports/bulk-delete", {
      body: reportIds,
    }),

  reviewReport: (reportId: number, body: { status: string; adminNotes?: string }) =>
    apiClient.post<{ message?: string }>(`/admin/manage-reports/${reportId}/review`, { body }),

  saveReportNotes: (reportId: number, adminNotes: string) =>
    apiClient.post<{ message?: string }>(`/admin/manage-reports/${reportId}/notes`, {
      body: { adminNotes },
    }),

  entityReports: (entityType: string, entityId: number) =>
    apiClient.get<ReportDetail[]>(
      `/admin/manage-reports/entity/${encodeURIComponent(entityType)}/${entityId}/details`,
    ),

  listProfanityWords: () =>
    apiClient.get<{ words: ProfanityWord[]; total: number }>("/admin/moderation/words"),

  addProfanityWord: (word: string) =>
    apiClient.post<{ success: boolean; word: ProfanityWord }>("/admin/moderation/words", {
      body: { word },
    }),

  setProfanityWordActive: (id: number, active: boolean) =>
    apiClient.patch<{ success: boolean }>(`/admin/moderation/words/${id}`, {
      body: { active },
    }),

  deleteProfanityWord: (id: number) =>
    apiClient.delete<{ success: boolean }>(`/admin/moderation/words/${id}`),

  testProfanityText: (text: string) =>
    apiClient.post<{ blocked: boolean; matches: string[] }>("/admin/moderation/words/test", {
      body: { text },
    }),

  bulkImportProfanityWords: (words: string[]) =>
    apiClient.post<{ added: number; skipped: number; errors: string[] }>(
      "/admin/moderation/words/bulk-import",
      { body: { words } },
    ),

  adminEvents: (params?: { search?: string; reportedOnly?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.search?.trim()) qs.set("search", params.search.trim());
    if (params?.reportedOnly) qs.set("reportedOnly", "true");
    return apiClient.get<{ events: AdminEventRow[]; total: number }>(
      `/admin/events?${qs.toString()}`,
    );
  },

  subscriptionStatistics: () =>
    apiClient.get<Record<string, number>>("/admin/subscriptions/statistics"),

  subscriptions: (params?: { page?: number; size?: number; type?: string; activeOnly?: boolean }) => {
    const qs = new URLSearchParams();
    qs.set("page", String(params?.page ?? 0));
    qs.set("size", String(params?.size ?? 50));
    if (params?.type) qs.set("type", params.type);
    if (params?.activeOnly === false) qs.set("activeOnly", "false");
    return apiClient.get<{
      subscriptions: { id: number; username: string | null; email: string | null; type: string; active: boolean; subscribedAt: string | null }[];
      totalElements: number;
      totalPages: number;
    }>(`/admin/subscriptions?${qs.toString()}`);
  },

  listPodcastEpisodesAdmin: () =>
    apiClient.get<AdminPodcastEpisode[]>("/api/v1/podcast/episodes/all"),

  updatePodcastEpisode: async (id: number, form: FormData): Promise<AdminPodcastEpisode> => {
    const token = tokenStore.getAccess();
    const res = await fetch(resolveApiUrl(`/api/v1/podcast/episodes/${id}`), {
      method: "PATCH",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!res.ok) throw new Error("Update failed");
    return res.json() as Promise<AdminPodcastEpisode>;
  },

  deletePodcastEpisode: (id: number) =>
    apiClient.delete<{ message?: string }>(`/api/v1/podcast/episodes/${id}`),

  adminActions: (page = 0, size = 50) =>
    apiClient.get<{
      success: boolean;
      activities: ActivityItem[];
      totalElements: number;
      totalPages: number;
    }>(`/admin/api/activities/admin-actions?page=${page}&size=${size}`),

  activities: (limit = 500) =>
    apiClient.get<ActivitiesResponse>(`/admin/api/activities/recent?limit=${limit}`),

  activitiesSince: (lastId: number) =>
    apiClient.get<ActivitiesResponse>(`/admin/api/activities/since/${lastId}`),

  activitiesFiltered: (params: Record<string, string | number | undefined>) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v != null && v !== "") qs.set(k, String(v));
    }
    return apiClient.get<{
      success: boolean;
      activities: ActivityItem[];
      page?: number;
      size?: number;
      totalElements?: number;
      totalPages?: number;
      hasNext?: boolean;
      hasPrevious?: boolean;
      stats?: ActivityStats;
    }>(`/admin/api/activities/filtered?${qs.toString()}`);
  },

  activityStats: () =>
    apiClient.get<{ success: boolean; stats: ActivityStats }>("/admin/api/activities/stats"),

  topUsers: (limit = 10, hours = 24) =>
    apiClient.get<{ success?: boolean; topUsers?: { username: string; activityCount: number }[] }>(
      `/admin/api/activities/stats/top-users?limit=${limit}&hours=${hours}`,
    ),

  topActions: (hours = 24) =>
    apiClient.get<{ success?: boolean; topActions?: { action: string; count: number }[] }>(
      `/admin/api/activities/stats/top-actions?hours=${hours}`,
    ),

  cleanupActivities: (retentionDays: number) =>
    apiClient.post<{ success: boolean; message?: string }>(
      `/admin/api/activities/cleanup?retentionDays=${retentionDays}`,
    ),

  /** Browser download with Bearer — returns blob URL opener. */
  async exportActivitiesCsv(): Promise<void> {
    const token = tokenStore.getAccess();
    const res = await fetch(resolveApiUrl("/admin/api/activities/export"), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Export failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activities-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  async exportUsersCsv(params?: {
    search?: string;
    role?: string;
    status?: string;
    minStrikes?: number;
  }): Promise<void> {
    const qs = new URLSearchParams();
    if (params?.search?.trim()) qs.set("search", params.search.trim());
    if (params?.role && params.role !== "ALL") qs.set("role", params.role);
    if (params?.status && params.status !== "ALL") qs.set("status", params.status);
    if (params?.minStrikes != null && params.minStrikes > 0) {
      qs.set("minStrikes", String(params.minStrikes));
    }
    const token = tokenStore.getAccess();
    const res = await fetch(resolveApiUrl(`/admin/users/export?${qs.toString()}`), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Export failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  async exportSubscriptionsCsv(type?: string): Promise<void> {
    const qs = type ? `?type=${encodeURIComponent(type)}` : "";
    const token = tokenStore.getAccess();
    const res = await fetch(resolveApiUrl(`/admin/subscriptions/export${qs}`), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Export failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscriptions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
