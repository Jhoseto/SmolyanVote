"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/shared/lib/authContext";

interface FollowingIdsResponse {
  ids: number[];
}

/**
 * Followed author IDs for the current session — powers the “Следвани” feed
 * via `GET /api/v1/publications?userIds=`.
 *
 * Uses `/api/v1/users/me/following-ids` (JWT user id) so Cyrillic/space
 * usernames never break the request path.
 */
export function useFollowingAuthorIds(enabled: boolean) {
  const { user, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["publications", "following-author-ids", user?.id],
    enabled: enabled && isAuthenticated && !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const res = await apiClient.get<FollowingIdsResponse>("/api/v1/users/me/following-ids");
      return Array.isArray(res.ids) ? res.ids.filter((id) => Number.isFinite(id)) : [];
    },
  });
}
