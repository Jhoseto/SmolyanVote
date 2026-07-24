/** Mirrors backend `PodcastEpisodeDTO` (Jackson getter-based serialization). */
export interface PodcastEpisode {
  id: number;
  title: string;
  description: string | null;
  audioUrl: string;
  imageUrl: string | null;
  publishDate: string | null;
  formattedPublishDate: string | null;
  durationSeconds: number | null;
  formattedDuration: string | null;
  episodeNumber: number | null;
  listenCount: number | null;
}

/** Backend `SubscriptionType` enum — full set, only `PODCAST_EPISODES` is toggled here. */
export type PodcastSubscriptionType =
  | "PODCAST_EPISODES"
  | "ELECTION_UPDATES"
  | "CITY_NEWS"
  | "ALL_NOTIFICATIONS";

export interface SubscriptionResponse {
  success: boolean;
  types: PodcastSubscriptionType[];
}

/** Admin-only — `POST /api/v1/podcast/episodes` (multipart), mirrors `PodcastAdminController`. */
export interface CreatePodcastEpisodePayload {
  title: string;
  description?: string;
  /** Direct MP3 URL (Internet Archive) — stored as-is, not uploaded to Cloudinary. */
  audioUrl: string;
  imageFile?: File | null;
  durationSeconds?: number | null;
  isPublished: boolean;
}
