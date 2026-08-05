import type { MetadataRoute } from "next";
import { resolveApiUrl } from "@/config/env";

const BASE = "https://smolyanvote.com";

export async function fetchPublicationSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  try {
    let page = 0;
    let hasNext = true;
    while (hasNext && page < 20) {
      const res = await fetch(
        resolveApiUrl(`/api/v1/publications?page=${page}&size=100&sort=date-desc`),
        { next: { revalidate: 300 } },
      );
      if (!res.ok) break;
      const data = (await res.json()) as {
        content?: Array<{ id: number; updatedAt?: string; createdAt?: string }>;
        hasNext?: boolean;
      };
      for (const item of data.content ?? []) {
        entries.push({
          url: `${BASE}/publications/${item.id}`,
          lastModified: new Date(item.updatedAt || item.createdAt || Date.now()),
          changeFrequency: "daily",
          priority: 0.8,
        });
      }
      hasNext = Boolean(data.hasNext);
      page += 1;
    }
  } catch {
    /* API down */
  }
  return entries;
}
