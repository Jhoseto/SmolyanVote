"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { SharedEntityKind, SharedEntityRef } from "../lib/resolveSharedEntity";

/** Normalised shape the card renders, regardless of which endpoint answered. */
export interface SharedEntitySummary {
  kind: SharedEntityKind;
  id: number;
  title: string;
  authorUsername: string | null;
  authorImageUrl: string | null;
  imageUrl: string | null;
  /** Two stat pills, e.g. гласове / коментари. */
  stats: { icon: string; value: number | string }[];
  location?: string | null;
  coordinates?: { lat: number; lng: number } | null;
}

interface RawCommon {
  id: number;
  title: string;
  authorUsername?: string;
  authorImageUrl?: string | null;
  imageUrl?: string | null;
  creator?: { username: string; imageUrl: string | null };
  images?: string[];
  imageUrls?: string[];
  totalVotes?: number;
  commentsCount?: number;
  viewsCount?: number;
  viewCounter?: number;
  likesCount?: number;
  priorityBoostCount?: number;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

const ENDPOINTS: Record<SharedEntityKind, (id: number) => string> = {
  publication: (id) => `/api/v1/publications/${id}`,
  signal: (id) => `/api/v1/signals/${id}`,
  simpleevent: (id) => `/api/v1/events/simple/${id}`,
  referendum: (id) => `/api/v1/events/referendum/${id}`,
  multipoll: (id) => `/api/v1/events/multipoll/${id}`,
};

export const KIND_LABEL: Record<SharedEntityKind, string> = {
  publication: "Публикация",
  signal: "Сигнал",
  simpleevent: "Събитие",
  referendum: "Референдум",
  multipoll: "Анкета",
};

export const KIND_ICON: Record<SharedEntityKind, string> = {
  publication: "bi-file-text",
  signal: "bi-exclamation-triangle",
  simpleevent: "bi-calendar-event",
  referendum: "bi-check2-square",
  multipoll: "bi-bar-chart",
};

function normalise(kind: SharedEntityKind, raw: RawCommon): SharedEntitySummary {
  const stats: SharedEntitySummary["stats"] = [];
  if (raw.totalVotes != null) stats.push({ icon: "bi-check2-square", value: raw.totalVotes });
  if (raw.likesCount != null) stats.push({ icon: "bi-hand-thumbs-up", value: raw.likesCount });
  if (raw.priorityBoostCount != null)
    stats.push({ icon: "bi-arrow-up-circle", value: raw.priorityBoostCount });
  if (raw.commentsCount != null) stats.push({ icon: "bi-chat", value: raw.commentsCount });
  const views = raw.viewsCount ?? raw.viewCounter;
  if (views != null && stats.length < 3) stats.push({ icon: "bi-eye", value: views });

  return {
    kind,
    id: raw.id,
    title: raw.title,
    authorUsername: raw.authorUsername ?? raw.creator?.username ?? null,
    authorImageUrl: raw.authorImageUrl ?? raw.creator?.imageUrl ?? null,
    imageUrl: raw.imageUrl ?? raw.images?.[0] ?? raw.imageUrls?.[0] ?? null,
    stats: stats.slice(0, 3),
    location: raw.location ?? null,
    coordinates:
      raw.latitude != null && raw.longitude != null
        ? { lat: raw.latitude, lng: raw.longitude }
        : null,
  };
}

export function useSharedEntity(ref: SharedEntityRef | null) {
  return useQuery({
    queryKey: ["messenger", "shared-entity", ref?.kind, ref?.id],
    queryFn: async () => {
      const target = ref as SharedEntityRef;
      const raw = await apiClient.get<RawCommon>(ENDPOINTS[target.kind](target.id));
      return normalise(target.kind, raw);
    },
    enabled: ref != null,
    staleTime: 5 * 60_000,
    retry: false,
  });
}
