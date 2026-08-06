"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/shared/lib/authContext";
import { toAchievementStats, type AchievementStats } from "@/shared/lib/gamification";

/** Lean subset of `PublicProfileDTO` for shell menus / gamification UI. */
export interface MyProfileStats {
  id: number;
  username: string;
  reputationScore: number;
  reputationBadge: string;
  eventsCount: number;
  publicationsCount: number;
  signalsCount: number;
  votesCount: number;
  followersCount: number;
  followingCount: number;
  created: string;
}

export function myProfileStatsQueryKey(username: string | undefined) {
  return ["my-profile-stats", username] as const;
}

function toStats(data: MyProfileStats): AchievementStats {
  return toAchievementStats(data);
}

export function useMyProfileStats(enabled = true) {
  const { user, isAuthenticated } = useAuth();
  const username = user?.username;

  const query = useQuery({
    queryKey: myProfileStatsQueryKey(username),
    enabled: enabled && isAuthenticated && !!username,
    staleTime: 60_000,
    queryFn: async () => {
      const data = await apiClient.get<MyProfileStats>(
        `/api/v1/users/${encodeURIComponent(username!)}`,
      );
      if (!data) throw new Error("Профилът не върна данни.");
      return data;
    },
  });

  return {
    ...query,
    stats: query.data ? toStats(query.data) : null,
  };
}
