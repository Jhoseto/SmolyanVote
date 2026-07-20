import type { Metadata } from "next";

const SITE = "https://smolyanvote.com";
const DEFAULT_IMAGE = `${SITE}/images/SMVshare.JPG`;

export interface SocialMetaInput {
  title: string;
  description?: string | null;
  path: string;
  image?: string | null;
  type?: "website" | "article";
}

/** Shared Open Graph / Twitter cards (V1 `*-social.html` parity). */
export function buildSocialMetadata({
  title,
  description,
  path,
  image,
  type = "article",
}: SocialMetaInput): Metadata {
  const desc = (description?.trim() || "SmolyanVote — гласът на Смолян").slice(0, 200);
  const fullTitle = title.includes("SmolyanVote") ? title : `${title} - SmolyanVote`;
  const url = `${SITE}${path.startsWith("/") ? path : `/${path}`}`;
  const img = image?.trim() || DEFAULT_IMAGE;

  return {
    title: fullTitle,
    description: desc,
    alternates: { canonical: path },
    openGraph: {
      type,
      siteName: "SmolyanVote",
      title: fullTitle,
      description: desc,
      url,
      locale: "bg_BG",
      images: [{ url: img, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@SmolyanVote",
      title: fullTitle,
      description: desc,
      images: [img],
    },
  };
}

export function firstImage(...candidates: Array<string | null | undefined | string[]>): string | null {
  for (const c of candidates) {
    if (Array.isArray(c) && c[0]) return c[0];
    if (typeof c === "string" && c.trim()) return c;
  }
  return null;
}
