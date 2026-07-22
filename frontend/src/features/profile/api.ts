import { apiClient } from "@/lib/api/client";
import { normalizeUsername } from "./lib/normalizeUsername";
import type {
  ConnectionsKind,
  ConnectionsListResponse,
  ProfileEventItem,
  ProfilePublicationsPage,
  ProfileSignalItem,
  PublicProfile,
  UpdateProfilePayload,
} from "./types";

function userPath(username: string, suffix = "") {
  return `/api/v1/users/${encodeURIComponent(normalizeUsername(username))}${suffix}`;
}

/**
 * Thin wrappers over `UsersController` (MODERN_FRONTEND_PLAN.md Фаза 7).
 * Publications intentionally reuse the existing `GET /api/v1/publications?userIds=`
 * feed endpoint (Фаза 4) directly by URL — no dedicated backend route, no
 * cross-feature import of `publications/api.ts` (features stay decoupled;
 * `profile` only depends on its own lean `ProfilePublicationItem` view of the
 * shared JSON contract).
 */
export const profileApi = {
  get: (username: string) => apiClient.get<PublicProfile>(userPath(username)),

  events: (username: string) => apiClient.get<ProfileEventItem[]>(userPath(username, "/events")),

  signals: (username: string) => apiClient.get<ProfileSignalItem[]>(userPath(username, "/signals")),

  publications: (authorId: number, page: number, size = 9) =>
    apiClient.get<ProfilePublicationsPage>(
      `/api/v1/publications?userIds=${authorId}&page=${page}&size=${size}`,
    ),

  connections: (username: string, kind: ConnectionsKind, page: number, size: number, search?: string) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (search) params.set("search", search);
    return apiClient.get<ConnectionsListResponse>(`${userPath(username, `/${kind}`)}?${params.toString()}`);
  },

  updateMe: ({ bio, location, avatar }: UpdateProfilePayload) => {
    const form = new FormData();
    form.set("bio", bio);
    form.set("location", location);
    if (avatar) form.set("avatar", avatar);
    return apiClient.putForm<PublicProfile>("/api/v1/users/me", { body: form });
  },
};
