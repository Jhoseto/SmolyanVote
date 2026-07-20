"use client";

import { useQuery } from "@tanstack/react-query";
import { profileApi } from "../api";

/** Unpaginated (mirrors legacy `/profile/api/events` — a user's own event count is small). */
export function useProfileEvents(username: string) {
  return useQuery({
    queryKey: ["profile", username, "events"],
    queryFn: () => profileApi.events(username),
    staleTime: 30_000,
  });
}
