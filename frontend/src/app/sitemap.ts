import type { MetadataRoute } from "next";
import { resolveApiUrl } from "@/config/env";

const BASE_URL = "https://smolyanvote.com";

interface PublicationsPage {
  content?: Array<{ id: number; updatedAt?: string; createdAt?: string }>;
  hasNext?: boolean;
  page?: number;
}

async function fetchPublicationEntries(): Promise<MetadataRoute.Sitemap> {
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
      const data = (await res.json()) as PublicationsPage;
      for (const item of data.content ?? []) {
        entries.push({
          url: `${BASE_URL}/publications/${item.id}`,
          lastModified: new Date(item.updatedAt || item.createdAt || Date.now()),
          changeFrequency: "daily",
          priority: 0.8,
        });
      }
      hasNext = Boolean(data.hasNext);
      page += 1;
    }
  } catch {
    /* API down — static routes still returned */
  }
  return entries;
}

/**
 * Sitemap for Next.js routes + dynamic publication articles (SEO/GEO).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const publications = await fetchPublicationEntries();

  return [
    { url: `${BASE_URL}/`, lastModified, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/events`, lastModified, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/publications`, lastModified, changeFrequency: "hourly", priority: 0.9 },
    ...publications,
    { url: `${BASE_URL}/signals`, lastModified, changeFrequency: "hourly", priority: 0.8 },
    { url: `${BASE_URL}/podcast`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/faq`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/contacts`, lastModified, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE_URL}/terms-and-conditions`, lastModified, changeFrequency: "yearly", priority: 0.5 },
  ];
}
