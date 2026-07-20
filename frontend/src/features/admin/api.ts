import { resolveApiUrl } from "@/config/env";
import { apiClient } from "@/lib/api/client";
import { tokenStore } from "@/lib/api/tokenStore";
import type {
  ActivitiesResponse,
  ActivityItem,
  ActivityStats,
  AdminDashboardData,
  AdminUser,
  AdminUsersResponse,
  BanHistoryItem,
  BulkResult,
  GroupedReport,
  MetricMap,
  PageResponse,
  ReportDetail,
  ReportStatistics,
  UserStatistics,
} from "./types";

async function getMap(path: string): Promise<MetricMap> {
  return apiClient.get<MetricMap>(path);
}

export const adminApi = {
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

  users: () => apiClient.get<AdminUsersResponse>("/admin/users"),

  user: (id: number) => apiClient.get<AdminUser>(`/admin/users/${id}`),

  banUser: (id: number, body: { reason: string; banType: string; durationDays?: number }) =>
    apiClient.post<{ message?: string; error?: string }>(`/admin/users/${id}/ban`, { body }),

  unbanUser: (id: number) =>
    apiClient.post<{ message?: string; error?: string }>(`/admin/users/${id}/unban`),

  changeRole: (id: number, body: { role: string; reason: string }) =>
    apiClient.post<{ message?: string; error?: string }>(`/admin/users/${id}/role`, { body }),

  activateUser: (id: number) =>
    apiClient.post<{ message?: string; error?: string }>(`/admin/users/${id}/activate`),

  deleteUser: (id: number) =>
    apiClient.delete<{ message?: string; error?: string }>(`/admin/users/${id}`),

  bulkRoleChange: (userIds: number[], newRole: string) =>
    apiClient.post<BulkResult>("/admin/users/bulk-role-change", {
      body: { userIds, newRole },
    }),

  bulkBan: (body: {
    userIds: number[];
    banType: string;
    reason: string;
    durationDays?: number;
  }) => apiClient.post<BulkResult>("/admin/users/bulk-ban", { body }),

  bulkActivate: (userIds: number[]) =>
    apiClient.post<BulkResult>("/admin/users/bulk-activate", { body: { userIds } }),

  history: () => apiClient.get<BanHistoryItem[]>("/admin/users/history"),

  userHistory: (username: string) =>
    apiClient.get<BanHistoryItem[]>(`/admin/users/${encodeURIComponent(username)}/history`),

  reportStatistics: () =>
    apiClient.get<ReportStatistics>("/admin/manage-reports/statistics"),

  groupedReports: (page = 0, size = 50) =>
    apiClient.get<PageResponse<GroupedReport>>(
      `/admin/manage-reports/grouped?page=${page}&size=${size}`,
    ),

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

  entityReports: (entityType: string, entityId: number) =>
    apiClient.get<ReportDetail[]>(
      `/admin/manage-reports/entity/${encodeURIComponent(entityType)}/${entityId}/details`,
    ),

  activities: () => apiClient.get<ActivitiesResponse>("/admin/api/activities/recent"),

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
      stats?: ActivityStats;
    }>(`/admin/api/activities/filtered?${qs.toString()}`);
  },

  activityStats: () =>
    apiClient.get<{ success: boolean; stats: ActivityStats }>("/admin/api/activities/stats"),

  topUsers: (limit = 10, hours = 24) =>
    apiClient.get<{ success?: boolean; data?: unknown }>(
      `/admin/api/activities/stats/top-users?limit=${limit}&hours=${hours}`,
    ),

  topActions: (hours = 24) =>
    apiClient.get<{ success?: boolean; data?: unknown }>(
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
};
