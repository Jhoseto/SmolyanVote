import { env, resolveApiUrl } from "@/config/env";
import { firstImage } from "./buildSocialMetadata";
import type { OgShareCardInput, OgShareKind } from "./ogShareCard";

function excerpt(text: string | null | undefined, title: string, max = 90): string | null {
  if (!text?.trim()) return null;
  let t = text.replace(/\s+/g, " ").trim();
  // Avoid repeating the title inside the subtitle line.
  if (title && t.toLowerCase().startsWith(title.toLowerCase())) {
    t = t.slice(title.length).replace(/^[\s:.\-–—]+/, "").trim();
  }
  if (!t) return null;
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`;
}

function requireTitle(raw: string | null | undefined, fallback: string): string {
  const t = raw?.replace(/\s+/g, " ").trim();
  return t && t.length > 0 ? t : fallback;
}

/** Default Spring/static branding assets — never use as the OG photograph. */
export function isOgPlaceholderImage(url: string): boolean {
  const u = url.toLowerCase();
  return (
    u.includes("defaultevent") ||
    u.includes("defaultreferendum") ||
    u.includes("defaultmultipoll") ||
    u.includes("smvshare") ||
    u.includes("logonew") ||
    u.includes("default-avatar") ||
    u.includes("/images/eventimages/")
  );
}

/** Absolute URL for ImageResponse, or null → atmospheric brand photo. */
export function resolveOgCoverUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  const raw = url.trim();
  if (isOgPlaceholderImage(raw)) return null;

  if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:")) {
    return raw;
  }

  const path = raw.startsWith("/") ? raw : `/${raw}`;
  const origin = (env.NEXT_PUBLIC_BACKEND_ORIGIN || "https://smolyanvote.com").replace(/\/$/, "");
  return `${origin}${path}`;
}

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(resolveApiUrl(path), { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchPublicationOg(id: string): Promise<OgShareCardInput> {
  const data = await fetchJson<{
    title?: string;
    content?: string;
    excerpt?: string | null;
    imageUrl?: string | null;
    authorUsername?: string | null;
  }>(`/api/v1/publications/${id}`);

  if (!data) {
    return {
      kind: "publication",
      title: "Публикация от Смолян",
      meta: "Смолян · smolyanvote.com",
    };
  }

  const title = requireTitle(data.title, "Публикация от Смолян");
  return {
    kind: "publication",
    title,
    subtitle: excerpt(data.excerpt || data.content, title),
    meta: data.authorUsername ? `от ${data.authorUsername}` : "Смолян · smolyanvote.com",
    coverUrl: resolveOgCoverUrl(firstImage(data.imageUrl)),
  };
}

type VotePayload = {
  title?: string;
  description?: string;
  location?: string;
  creatorName?: string;
  images?: string[];
  imageUrls?: string[];
};

function voteCard(kind: Exclude<OgShareKind, "publication">, data: VotePayload | null): OgShareCardInput {
  const fallbackTitle: Record<Exclude<OgShareKind, "publication">, string> = {
    event: "Гласуване в Смолян",
    referendum: "Референдум в Смолян",
    multipoll: "Анкета в Смолян",
  };

  if (!data) {
    return {
      kind,
      title: fallbackTitle[kind],
      meta: "Смолян · smolyanvote.com",
    };
  }

  const title = requireTitle(data.title, fallbackTitle[kind]);
  const metaParts = [data.location?.trim(), data.creatorName ? `от ${data.creatorName}` : null].filter(
    Boolean,
  );

  const rawCover = firstImage(data.imageUrls, data.images);
  const coverUrl = resolveOgCoverUrl(rawCover);

  return {
    kind,
    title,
    subtitle: null,
    meta: metaParts.length > 0 ? metaParts.join(" · ") : "Смолян · smolyanvote.com",
    // Real uploads only. Spring defaults (/images/eventImages/…) → hero atmosphere.
    coverUrl,
  };
}

export async function fetchEventOg(id: string): Promise<OgShareCardInput> {
  return voteCard("event", await fetchJson<VotePayload>(`/api/v1/events/simple/${id}`));
}

export async function fetchReferendumOg(id: string): Promise<OgShareCardInput> {
  return voteCard("referendum", await fetchJson<VotePayload>(`/api/v1/events/referendum/${id}`));
}

export async function fetchMultipollOg(id: string): Promise<OgShareCardInput> {
  return voteCard("multipoll", await fetchJson<VotePayload>(`/api/v1/events/multipoll/${id}`));
}
