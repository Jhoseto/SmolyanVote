import type { MetadataRoute } from "next";
import { resolveApiUrl } from "@/config/env";
import type { BackendEventType } from "@/features/events/types";

const BASE = "https://smolyanvote.com";

function eventUrl(type: BackendEventType, id: number): string {
  if (type === "REFERENDUM") return `${BASE}/referendum/${id}`;
  if (type === "MULTI_POLL") return `${BASE}/multipoll/${id}`;
  return `${BASE}/event/${id}`;
}

export async function fetchEventSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const res = await fetch(resolveApiUrl("/api/v1/events"), { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      events?: Array<{ id: number; eventType: BackendEventType; createdAt?: string }>;
    };
    return (data.events ?? []).map((item) => ({
      url: eventUrl(item.eventType, item.id),
      lastModified: new Date(item.createdAt || Date.now()),
      changeFrequency: "weekly" as const,
      priority: 0.85,
    }));
  } catch {
    return [];
  }
}
