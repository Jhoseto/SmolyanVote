import type { MetadataRoute } from "next";

const BASE_URL = "https://smolyanvote.com";

/**
 * Sitemap for the routes currently served by the Next.js frontend. Dynamic
 * content (events, publications, user profiles, ...) still lives behind the
 * legacy backend's own `/sitemap.xml` until those sections are migrated —
 * extend this file route-by-route as each one moves over (see
 * MODERN_FRONTEND_PLAN.md).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: `${BASE_URL}/`, lastModified, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/events`, lastModified, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/publications`, lastModified, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/signals`, lastModified, changeFrequency: "hourly", priority: 0.8 },
    { url: `${BASE_URL}/podcast`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/faq`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/contacts`, lastModified, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE_URL}/terms-and-conditions`, lastModified, changeFrequency: "yearly", priority: 0.5 },
  ];
}
