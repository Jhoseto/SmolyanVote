import type { MetadataRoute } from "next";
import { TOPIC_HUBS } from "@/features/topics/data/topicHubs";

const BASE = "https://smolyanvote.com";

export function fetchTopicSitemapEntries(): MetadataRoute.Sitemap {
  return [
    {
      url: `${BASE}/topics`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...TOPIC_HUBS.map((hub) => ({
      url: `${BASE}/topics/${hub.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
  ];
}
