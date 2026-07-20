import { apiClient } from "@/lib/api/client";
import type { PodcastEpisode, PodcastSubscriptionType, SubscriptionResponse } from "./types";

/**
 * Thin wrappers over `PodcastController` (`/api/podcast/episodes`, public — no
 * JWT gate, see MODERN_FRONTEND_PLAN.md Фаза 6) and the shared
 * `SubscriptionController` (`/api/v1/subscriptions`, JWT-required).
 */
export const podcastApi = {
  episodes: () => apiClient.get<PodcastEpisode[]>("/api/podcast/episodes"),

  incrementListen: (id: number) =>
    apiClient.post<PodcastEpisode>(`/api/podcast/episodes/${id}/increment-listen`),

  subscription: () => apiClient.get<SubscriptionResponse>("/api/v1/subscriptions"),

  updateSubscription: (types: PodcastSubscriptionType[]) =>
    apiClient.post<SubscriptionResponse>("/api/v1/subscriptions", { body: { types } }),
};
