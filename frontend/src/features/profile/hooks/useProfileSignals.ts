"use client";

import { useQuery } from "@tanstack/react-query";
import { profileApi } from "../api";

export function useProfileSignals(username: string) {
  return useQuery({
    queryKey: ["profile", username, "signals"],
    queryFn: () => profileApi.signals(username),
    staleTime: 30_000,
  });
}
