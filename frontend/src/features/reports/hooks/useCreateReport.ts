"use client";

import { useMutation } from "@tanstack/react-query";
import { reportsApi } from "../api";
import type { ReportableEntityType, ReportReason } from "../types";

export function useCreateReport(entityType: ReportableEntityType, entityId: number) {
  return useMutation({
    mutationFn: ({ reason, description }: { reason: ReportReason; description?: string }) =>
      reportsApi.create(entityType, entityId, reason, description),
  });
}
