import { z } from "zod";

/**
 * Public env for the browser. API/WS default to same-origin (`:3000`) so the
 * browser never talks to Spring directly — Next rewrites proxy to the backend.
 *
 * OAuth is the exception: it must open Spring on {@link NEXT_PUBLIC_BACKEND_ORIGIN}
 * so session cookies stick to the API host during the Google/Facebook round-trip.
 */
const envSchema = z.object({
  /** Empty = same-origin (`/api/...` via Next rewrite). */
  NEXT_PUBLIC_API_URL: z.string().default(""),
  /** Relative SockJS path or absolute URL. */
  NEXT_PUBLIC_WS_URL: z.string().default("/ws-svmessenger"),
  /** Spring origin for OAuth start only (and rewrite fallback). */
  NEXT_PUBLIC_BACKEND_ORIGIN: z
    .string()
    .url()
    .default("http://localhost:2662"),
  /** LiveKit cloud URL — fallback when token response omits `serverUrl`. */
  NEXT_PUBLIC_LIVEKIT_URL: z
    .string()
    .default("wss://smolyanvote-nq17fbx3.livekit.cloud"),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "",
  NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  NEXT_PUBLIC_BACKEND_ORIGIN: process.env.NEXT_PUBLIC_BACKEND_ORIGIN,
  NEXT_PUBLIC_LIVEKIT_URL: process.env.NEXT_PUBLIC_LIVEKIT_URL,
});

if (!parsed.success) {
  throw new Error(
    `Invalid environment variables:\n${parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n")}`,
  );
}

export const env = parsed.data;
export type Env = typeof env;

function stripTrailingSlash(url: string) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

/**
 * Resolve an API path for fetch().
 * - Browser + empty NEXT_PUBLIC_API_URL → relative `/api/...` (Next :3000)
 * - SSR → direct Spring via API_INTERNAL_URL / BACKEND_ORIGIN (no self-HTTP)
 */
export function resolveApiUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const normalized = path.startsWith("/") ? path : `/${path}`;
  const publicBase = env.NEXT_PUBLIC_API_URL.trim();

  if (publicBase) {
    return `${stripTrailingSlash(publicBase)}${normalized}`;
  }

  if (typeof window === "undefined") {
    const internal =
      process.env.API_INTERNAL_URL?.trim() ||
      env.NEXT_PUBLIC_BACKEND_ORIGIN ||
      "http://localhost:2662";
    return `${stripTrailingSlash(internal)}${normalized}`;
  }

  return normalized;
}

/** Full-page OAuth start — must hit Spring, not the Next rewrite. */
export function resolveOAuthStartUrl(provider: "google" | "facebook"): string {
  return `${stripTrailingSlash(env.NEXT_PUBLIC_BACKEND_ORIGIN)}/api/v1/auth/oauth/start?provider=${provider}`;
}

/** SockJS / WS endpoint (relative same-origin by default). */
export function resolveWsUrl(path?: string): string {
  if (path) {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    const publicBase = env.NEXT_PUBLIC_API_URL.trim();
    if (publicBase) return `${stripTrailingSlash(publicBase)}${normalized}`;
    return normalized;
  }
  return env.NEXT_PUBLIC_WS_URL.trim() || "/ws-svmessenger";
}
