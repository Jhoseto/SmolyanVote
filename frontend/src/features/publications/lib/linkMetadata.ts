import type { LinkMetadata } from "../types";

/** `Publication.linkMetadata` is a raw JSON string from the backend — never trust it blindly. */
export function parseLinkMetadata(raw: string | null | undefined): LinkMetadata | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<LinkMetadata>;
    if (!parsed || typeof parsed !== "object" || !parsed.url) return null;
    return { type: "website", ...parsed } as LinkMetadata;
  } catch {
    return null;
  }
}

const YOUTUBE_ID_PATTERN =
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]+)/;

/** Resolves a YouTube iframe URL from stored link metadata. */
export function getYoutubeEmbedUrl(metadata: LinkMetadata): string | null {
  if (metadata.type !== "youtube") return null;
  if (metadata.embedUrl) return metadata.embedUrl;
  if (metadata.videoId) return `https://www.youtube.com/embed/${metadata.videoId}`;
  const match = metadata.url.match(YOUTUBE_ID_PATTERN);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}
