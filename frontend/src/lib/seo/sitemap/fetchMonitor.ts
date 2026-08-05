import type { MetadataRoute } from "next";
import { resolveApiUrl } from "@/config/env";

const BASE = "https://smolyanvote.com";

interface FeedItem {
  id: string;
  itemType: string;
  publishedAt?: string | null;
  date?: string | null;
}

function feedItemUrl(item: FeedItem): string | null {
  const id = item.id.replace(/\D/g, "") || item.id;
  if (item.itemType === "contract") return `${BASE}/monitor/contract/${id}`;
  if (item.itemType === "document") return `${BASE}/monitor/document/${id}`;
  return null;
}

export async function fetchMonitorSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const staticTabs: MetadataRoute.Sitemap = [
    { url: `${BASE}/monitor`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/monitor/procurement`, changeFrequency: "daily", priority: 0.85 },
    { url: `${BASE}/monitor/budget`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/monitor/council`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/monitor/methodology`, changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE}/monitor/consultations`, changeFrequency: "weekly", priority: 0.75 },
    { url: `${BASE}/monitor/deadlines`, changeFrequency: "weekly", priority: 0.75 },
    { url: `${BASE}/monitor/anomalies`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/monitor/flows`, changeFrequency: "weekly", priority: 0.75 },
    { url: `${BASE}/monitor/eu-funds`, changeFrequency: "weekly", priority: 0.75 },
    { url: `${BASE}/monitor/region`, changeFrequency: "weekly", priority: 0.75 },
    { url: `${BASE}/monitor/search`, changeFrequency: "monthly", priority: 0.6 },
  ];

  const dynamic: MetadataRoute.Sitemap = [];
  try {
    let page = 0;
    let hasNext = true;
    const seen = new Set<string>();
    while (hasNext && page < 30) {
      const res = await fetch(
        resolveApiUrl(`/api/v1/monitor/feed?page=${page}&size=100&type=all`),
        { next: { revalidate: 600 } },
      );
      if (!res.ok) break;
      const data = (await res.json()) as {
        content?: FeedItem[];
        hasNext?: boolean;
        last?: boolean;
      };
      for (const item of data.content ?? []) {
        const url = feedItemUrl(item);
        if (!url || seen.has(url)) continue;
        seen.add(url);
        dynamic.push({
          url,
          lastModified: new Date(item.publishedAt || item.date || Date.now()),
          changeFrequency: "weekly",
          priority: 0.78,
        });
      }
      hasNext = Boolean(data.hasNext ?? !data.last);
      page += 1;
    }
  } catch {
    /* API down */
  }

  return [...staticTabs, ...dynamic];
}
