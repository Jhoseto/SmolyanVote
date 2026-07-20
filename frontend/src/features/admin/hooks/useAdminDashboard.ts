"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../api";

export const ADMIN_DASHBOARD_KEY = ["admin", "dashboard"] as const;

export function useAdminDashboard(enabled: boolean) {
  return useQuery({
    queryKey: ADMIN_DASHBOARD_KEY,
    queryFn: () => adminApi.dashboard(),
    enabled,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
}
