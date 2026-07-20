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
