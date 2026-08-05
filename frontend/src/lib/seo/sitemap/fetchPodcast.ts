import type { MetadataRoute } from "next";
import { resolveApiUrl } from "@/config/env";

const BASE = "https://smolyanvote.com";

export async function fetchPodcastSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const res = await fetch(resolveApiUrl("/api/podcast/episodes"), { next: { revalidate: 600 } });
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{ id: number; publishedAt?: string | null }>;
    return data.map((ep) => ({
      url: `${BASE}/podcast/episode/${ep.id}`,
      lastModified: new Date(ep.publishedAt || Date.now()),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
  } catch {
    return [];
  }
}
