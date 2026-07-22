"use client";

import { useQuery } from "@tanstack/react-query";
import { profileApi } from "../api";
import { normalizeUsername } from "../lib/normalizeUsername";

export function profileQueryKey(username: string) {
  return ["profile", normalizeUsername(username)] as const;
}

export function useProfile(username: string) {
  const normalized = normalizeUsername(username);

  return useQuery({
    queryKey: profileQueryKey(normalized),
    queryFn: async () => {
      const data = await profileApi.get(normalized);
      if (data == null) {
        throw new Error("Профилът не върна данни.");
      }
      return data;
    },
    enabled: normalized.length > 0,
    staleTime: 30_000,
  });
}
