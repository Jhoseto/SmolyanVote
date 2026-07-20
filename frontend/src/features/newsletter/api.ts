import { apiClient } from "@/lib/api/client";

/** Backend `SubscriptionType` values needed by the footer newsletter widget. */
export type NewsletterSubscriptionType =
  | "PODCAST_EPISODES"
  | "ELECTION_UPDATES"
  | "CITY_NEWS"
  | "ALL_NOTIFICATIONS";

interface SubscriptionResponse {
  success: boolean;
  types: NewsletterSubscriptionType[];
}

/** Thin wrapper over `/api/v1/subscriptions` — no business logic here. */
export const newsletterApi = {
  current: () => apiClient.get<SubscriptionResponse>("/api/v1/subscriptions"),

  subscribeToAll: () =>
    apiClient.post<SubscriptionResponse>("/api/v1/subscriptions", {
      body: { types: ["ALL_NOTIFICATIONS"] satisfies NewsletterSubscriptionType[] },
    }),
};
