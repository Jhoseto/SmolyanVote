/**
 * Recognises links that point back into SmolyanVote so the chat can render them
 * as native cards instead of raw URLs. Mirrors the route conventions in
 * `features/notifications/lib/normalizeActionUrl.ts`.
 */
export type SharedEntityKind =
  | "publication"
  | "signal"
  | "simpleevent"
  | "referendum"
  | "multipoll";

export interface SharedEntityRef {
  kind: SharedEntityKind;
  id: number;
  /** Canonical in-app href to open the entity. */
  href: string;
}

const URL_PATTERN = /https?:\/\/[^\s<]+|\/(?:publications|signals|event|referendum|multipoll)\/[^\s<]+/gi;

function toRef(kind: SharedEntityKind, id: number, href: string): SharedEntityRef {
  return { kind, id, href };
}

/** Returns the entity a single URL points at, or `null` when it is external. */
export function resolveSharedEntity(rawUrl: string): SharedEntityRef | null {
  let parsed: URL;
  try {
    const base = typeof window === "undefined" ? "http://localhost" : window.location.origin;
    parsed = new URL(rawUrl, base);
  } catch {
    return null;
  }

  // Only our own origin (or a relative link) can be resolved to an entity.
  if (typeof window !== "undefined" && parsed.origin !== window.location.origin) {
    const host = parsed.hostname.replace(/^www\./, "");
    if (!host.endsWith("smolyanvote.com") && host !== "localhost") return null;
  }

  const path = parsed.pathname.replace(/\/$/, "") || "/";

  const openSignal = parsed.searchParams.get("openSignal");
  if (path === "/signals" && openSignal && /^\d+$/.test(openSignal)) {
    return toRef("signal", Number(openSignal), `/signals?openSignal=${openSignal}`);
  }

  const openModal = parsed.searchParams.get("openModal");
  if (path === "/publications" && openModal && /^\d+$/.test(openModal)) {
    return toRef("publication", Number(openModal), `/publications/${openModal}`);
  }

  const patterns: [RegExp, SharedEntityKind, (id: string) => string][] = [
    [/^\/publications\/(\d+)$/, "publication", (id) => `/publications/${id}`],
    [/^\/signals\/(\d+)$/, "signal", (id) => `/signals?openSignal=${id}`],
    [/^\/event\/(\d+)$/, "simpleevent", (id) => `/event/${id}`],
    [/^\/referendum\/(\d+)$/, "referendum", (id) => `/referendum/${id}`],
    [/^\/multipoll\/(\d+)$/, "multipoll", (id) => `/multipoll/${id}`],
  ];

  for (const [pattern, kind, href] of patterns) {
    const match = path.match(pattern);
    if (match) return toRef(kind, Number(match[1]), href(match[1]));
  }

  return null;
}

/** First recognised SmolyanVote entity inside a message body. */
export function findSharedEntity(text: string): SharedEntityRef | null {
  const matches = text.match(URL_PATTERN);
  if (!matches) return null;
  for (const candidate of matches) {
    const ref = resolveSharedEntity(candidate.replace(/[),.]+$/, ""));
    if (ref) return ref;
  }
  return null;
}
