import { apiClient } from "@/lib/api/client";
import type {
  CreatePodcastEpisodePayload,
  PodcastEpisode,
  PodcastSubscriptionType,
  SubscriptionResponse,
} from "./types";

function toEpisodeFormData(payload: CreatePodcastEpisodePayload): FormData {
  const form = new FormData();
  form.append("title", payload.title);
  if (payload.description) form.append("description", payload.description);
  form.append("audioUrl", payload.audioUrl.trim());
  if (payload.imageFile) form.append("imageFile", payload.imageFile);
  if (payload.durationSeconds != null) form.append("durationSeconds", String(payload.durationSeconds));
  form.append("isPublished", String(payload.isPublished));
  return form;
}

/**
 * Thin wrappers over `PodcastController` (`/api/podcast/episodes`, public — no
 * JWT gate, see MODERN_FRONTEND_PLAN.md Фаза 6), the admin-only
 * `PodcastAdminController` (`/api/v1/podcast/episodes`, JWT + ROLE_ADMIN) and
 * the shared `SubscriptionController` (`/api/v1/subscriptions`, JWT-required).
 */
export const podcastApi = {
  episodes: () => apiClient.get<PodcastEpisode[]>("/api/podcast/episodes"),

  incrementListen: (id: number) =>
    apiClient.post<PodcastEpisode>(`/api/podcast/episodes/${id}/increment-listen`),

  createEpisode: (payload: CreatePodcastEpisodePayload) => {
    if (payload.imageFile) {
      return apiClient.postForm<PodcastEpisode>("/api/v1/podcast/episodes", {
        body: toEpisodeFormData(payload),
        direct: true,
      });
    }
    return apiClient.post<PodcastEpisode>("/api/v1/podcast/episodes", {
      body: {
        title: payload.title,
        description: payload.description ?? null,
        audioUrl: payload.audioUrl.trim(),
        durationSeconds: payload.durationSeconds ?? null,
        isPublished: payload.isPublished,
      },
    });
  },

  subscription: () => apiClient.get<SubscriptionResponse>("/api/v1/subscriptions"),

  updateSubscription: (types: PodcastSubscriptionType[]) =>
    apiClient.post<SubscriptionResponse>("/api/v1/subscriptions", { body: { types } }),
};
