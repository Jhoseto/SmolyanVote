"use client";

import { useQuery } from "@tanstack/react-query";
import { profileApi } from "../api";

export function profileQueryKey(username: string) {
  return ["profile", username] as const;
}

export function useProfile(username: string) {
  return useQuery({
    queryKey: profileQueryKey(username),
    queryFn: () => profileApi.get(username),
    staleTime: 30_000,
  });
}
