import { apiClient } from "@/lib/api/client";
import type { FollowActionResponse, FollowStatusResponse } from "./types";

/** Thin wrapper over `UserFollowController` (`/api/follow/**`, JWT-authenticated). */
export const followApi = {
  status: (userId: number) => apiClient.get<FollowStatusResponse>(`/api/follow/${userId}/status`),
  follow: (userId: number) => apiClient.post<FollowActionResponse>(`/api/follow/${userId}`),
  unfollow: (userId: number) => apiClient.delete<FollowActionResponse>(`/api/follow/${userId}`),
};
