import { apiClient } from "@/lib/api/client";
import type { CreateReportResponse, ReportableEntityType, ReportReason } from "./types";

/** Thin wrapper over `ReportsController` (`/api/reports/**`, JWT-authenticated). */
export const reportsApi = {
  create: (entityType: ReportableEntityType, entityId: number, reason: ReportReason, description?: string) =>
    apiClient.post<CreateReportResponse>(`/api/reports/${entityType}/${entityId}`, {
      body: { reason, description },
    }),
};
