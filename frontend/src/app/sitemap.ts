import type { MetadataRoute } from "next";
import { fetchPublicationSitemapEntries } from "@/lib/seo/sitemap/fetchPublications";
import { fetchSignalSitemapEntries } from "@/lib/seo/sitemap/fetchSignals";
import { fetchEventSitemapEntries } from "@/lib/seo/sitemap/fetchEvents";
import { fetchPodcastSitemapEntries } from "@/lib/seo/sitemap/fetchPodcast";
import { fetchMonitorSitemapEntries } from "@/lib/seo/sitemap/fetchMonitor";
import { fetchTopicSitemapEntries } from "@/lib/seo/sitemap/fetchTopics";

const BASE_URL = "https://smolyanvote.com";

/** Sitemap for all indexable Next.js routes + dynamic entities (SEO/GEO/AEO). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const [publications, signals, events, podcast, monitor] = await Promise.all([
    fetchPublicationSitemapEntries(),
    fetchSignalSitemapEntries(),
    fetchEventSitemapEntries(),
    fetchPodcastSitemapEntries(),
    fetchMonitorSitemapEntries(),
  ]);

  const topics = fetchTopicSitemapEntries();

  return [
    { url: `${BASE_URL}/`, lastModified, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/events`, lastModified, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/publications`, lastModified, changeFrequency: "hourly", priority: 0.9 },
    ...publications,
    ...events,
    { url: `${BASE_URL}/signals`, lastModified, changeFrequency: "hourly", priority: 0.85 },
    ...signals,
    { url: `${BASE_URL}/podcast`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    ...podcast,
    ...monitor,
    ...topics,
    { url: `${BASE_URL}/about`, lastModified, changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE_URL}/faq`, lastModified, changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE_URL}/terms-and-conditions`, lastModified, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE_URL}/llms.txt`, lastModified, changeFrequency: "weekly", priority: 0.3 },
    { url: `${BASE_URL}/ai-sitemap.txt`, lastModified, changeFrequency: "daily", priority: 0.3 },
  ];
}
