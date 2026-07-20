"use client";

import { useQuery } from "@tanstack/react-query";
import { followApi } from "../api";

export function useFollowStatus(userId: number, enabled: boolean) {
  return useQuery({
    queryKey: ["follow", "status", userId],
    queryFn: () => followApi.status(userId),
    enabled,
    staleTime: 60_000,
  });
}
