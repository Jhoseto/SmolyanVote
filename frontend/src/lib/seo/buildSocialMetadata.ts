import type { Metadata } from "next";

const SITE = "https://smolyanvote.com";
const DEFAULT_IMAGE = `${SITE}/images/SMVshare.JPG`;

export interface SocialMetaInput {
  title: string;
  description?: string | null;
  path: string;
  /**
   * Absolute or site-relative image. Prefer {@link brandedOgImageUrl} so Facebook
   * scrapes the branded 1200×630 template instead of a raw photo.
   */
  image?: string | null;
  type?: "website" | "article";
  publishedTime?: string | null;
  modifiedTime?: string | null;
  authors?: string[] | null;
  section?: string | null;
}

/** Absolute URL of the App Router `opengraph-image` for a detail path. */
export function brandedOgImageUrl(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  const base = clean.endsWith("/") ? clean.slice(0, -1) : clean;
  return `${SITE}${base}/opengraph-image`;
}

/** Shared Open Graph / Twitter cards (V1 `*-social.html` parity). */
export function buildSocialMetadata({
  title,
  description,
  path,
  image,
  type = "article",
  publishedTime,
  modifiedTime,
  authors,
  section,
}: SocialMetaInput): Metadata {
  const desc = (description?.trim() || "SmolyanVote — гласът на Смолян").slice(0, 200);
  const fullTitle = title.includes("SmolyanVote") ? title : `${title} - SmolyanVote`;
  const url = `${SITE}${path.startsWith("/") ? path : `/${path}`}`;
  const img = image?.trim() || DEFAULT_IMAGE;

  return {
    title: fullTitle,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      type,
      siteName: "SmolyanVote",
      title: fullTitle,
      description: desc,
      url,
      locale: "bg_BG",
      images: [{ url: img, width: 1200, height: 630, alt: title }],
      ...(type === "article"
        ? {
            publishedTime: publishedTime ?? undefined,
            modifiedTime: modifiedTime ?? undefined,
            authors: authors?.length ? authors : undefined,
            section: section ?? undefined,
          }
        : {}),
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

/** Listing/hub pages — ensures correct OG url (not homepage inheritance). */
export function buildListingMetadata(input: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return buildSocialMetadata({
    title: input.title,
    description: input.description,
    path: input.path,
    type: "website",
  });
}

/** Utility/create flows — noindex. */
export const NOINDEX_ROBOTS: Metadata["robots"] = { index: false, follow: false };
