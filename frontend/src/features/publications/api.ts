import { apiClient } from "@/lib/api/client";
import type {
  ApiMessageResponse,
  CreatePublicationPayload,
  ImageUploadResponse,
  LinkPreviewResponse,
  Publication,
  PublicationBookmarkResponse,
  PublicationReactionResponse,
  PublicationShareResponse,
  PublicationsLastActivity,
  PublicationsListParams,
  PublicationsPageResponse,
  PublicationsSidebarStats,
  PublicationStatSummary,
  TopAuthorsResponse,
  TrendingTopic,
  UserSearchResult,
} from "./types";

function buildQuery(params: PublicationsListParams): string {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("size", String(params.size));
  if (params.search) query.set("search", params.search);
  if (params.category) query.set("category", params.category);
  if (params.time) query.set("time", params.time);
  if (params.sort) query.set("sort", params.sort);
  if (params.author) query.set("author", params.author);
  if (params.userIds) query.set("userIds", params.userIds);
  return query.toString();
}

export interface OnlineUser {
  id: number;
  username: string;
  imageUrl: string | null;
  isFollowing: boolean;
  isSelf: boolean;
}

/**
 * Thin wrappers over `PublicationsController` — public GET endpoints for
 * the publications feed. No business logic here (filtering lives in
 * `PublicationService`, per-item shaping in `PublicationDetailService`).
 */
export const publicationsApi = {
  list: (params: PublicationsListParams) =>
    apiClient.get<PublicationsPageResponse>(`/api/v1/publications?${buildQuery(params)}`),

  detail: (id: number) => apiClient.get<Publication>(`/api/v1/publications/${id}`),

  create: (payload: CreatePublicationPayload) =>
    apiClient.post<Publication>("/api/v1/publications", { body: payload }),

  update: (id: number, payload: CreatePublicationPayload) =>
    apiClient.put<Publication>(`/api/v1/publications/${id}`, { body: payload }),

  uploadImage: (image: File) => {
    const form = new FormData();
    form.append("image", image);
    return apiClient.postForm<ImageUploadResponse>("/api/v1/publications/upload-image", { body: form });
  },

  linkPreview: (url: string) =>
    apiClient.get<LinkPreviewResponse>(`/api/v1/publications/link-preview?url=${encodeURIComponent(url)}`),

  remove: (id: number) => apiClient.delete<ApiMessageResponse>(`/api/v1/publications/${id}`),

  like: (id: number) => apiClient.post<PublicationReactionResponse>(`/api/v1/publications/${id}/like`),

  dislike: (id: number) => apiClient.post<PublicationReactionResponse>(`/api/v1/publications/${id}/dislike`),

  bookmark: (id: number) => apiClient.post<PublicationBookmarkResponse>(`/api/v1/publications/${id}/bookmark`),

  bookmarked: (params: { page: number; size: number }) =>
    apiClient.get<PublicationsPageResponse>(
      `/api/v1/publications/bookmarked?page=${params.page}&size=${params.size}`,
    ),

  /** Recording a share doesn't require auth (mirrors legacy `sharePublication`). */
  share: (id: number) =>
    apiClient.post<PublicationShareResponse>(`/api/v1/publications/${id}/share`, { anonymous: true }),

  likedUsers: (id: number) => apiClient.get<UserSearchResult[]>(`/api/v1/publications/${id}/liked-users`),

  dislikedUsers: (id: number) => apiClient.get<UserSearchResult[]>(`/api/v1/publications/${id}/disliked-users`),

  sidebarStats: () => apiClient.get<PublicationsSidebarStats>("/api/v1/publications/sidebar/stats"),

  sidebarTopAuthors: () => apiClient.get<TopAuthorsResponse>("/api/v1/publications/sidebar/top-authors"),

  sidebarTrending: () => apiClient.get<TrendingTopic[]>("/api/v1/publications/sidebar/trending"),

  sidebarLastActivity: () => apiClient.get<PublicationsLastActivity>("/api/v1/publications/sidebar/last-activity"),

  sidebarMostCommented: () =>
    apiClient.get<PublicationStatSummary[]>("/api/v1/publications/sidebar/most-commented"),

  sidebarTopViewed: () => apiClient.get<PublicationStatSummary[]>("/api/v1/publications/sidebar/top-viewed"),

  sidebarFromAdmin: () =>
    apiClient.get<PublicationStatSummary>("/api/v1/publications/sidebar/from-admin"),

  sidebarOnlineUsers: (limit = 5) =>
    apiClient.get<OnlineUser[]>(`/api/v1/publications/sidebar/online-users?limit=${limit}`),

  /** Cross-feed teasers — thin URL reuse (no feature→feature imports). */
  cityEventsTeaser: () =>
    apiClient.get<{ events: Array<{
      id: number;
      eventType: "SIMPLEEVENT" | "REFERENDUM" | "MULTI_POLL";
      eventStatus: string;
      title: string;
      createdAt: string;
      creatorName: string;
    }> }>("/api/v1/events"),

  citySignalsTeaser: () =>
    apiClient.get<Array<{
      id: number;
      title: string;
      categoryLabel: string;
      createdAt: string;
      isActive: boolean;
    }>>("/api/v1/signals?sort=newest"),

  /** `/api/svmessenger/users/search` — reused directly (thin fetch, not a cross-feature import). */
  searchUsers: (query: string) =>
    apiClient.get<UserSearchResult[]>(`/api/svmessenger/users/search?query=${encodeURIComponent(query)}`),
};
