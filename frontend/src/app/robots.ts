import type { MetadataRoute } from "next";

const BASE_URL = "https://smolyanvote.com";

const DISALLOW = [
  "/admin",
  "/login",
  "/register",
  "/profile",
  "/call-window",
  "/oauth-callback",
  "/confirm",
  "/reset-password",
  "/forgotten_password",
  "/publications/saved",
  "/event/new",
  "/referendum/new",
  "/multipoll/new",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/llms.txt", "/ai-sitemap.txt", "/topics/"],
        disallow: [...DISALLOW, "/*/edit"],
      },
    ],
    sitemap: [`${BASE_URL}/sitemap.xml`, `${BASE_URL}/ai-sitemap.txt`],
  };
}
