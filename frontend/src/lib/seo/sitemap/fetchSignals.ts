import type { MetadataRoute } from "next";
import { resolveApiUrl } from "@/config/env";

const BASE = "https://smolyanvote.com";

export async function fetchSignalSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const res = await fetch(resolveApiUrl("/api/v1/signals/dataset"), {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{
      id: number;
      modifiedAt?: string;
      createdAt?: string;
    }>;
    return data.map((item) => ({
      url: `${BASE}/signals/${item.id}`,
      lastModified: new Date(item.modifiedAt || item.createdAt || Date.now()),
      changeFrequency: "weekly" as const,
      priority: 0.75,
    }));
  } catch {
    return [];
  }
}
