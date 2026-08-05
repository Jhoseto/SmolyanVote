import { z } from "zod";

/**
 * Public env for the browser. API/WS default to same-origin (`:3000`) so the
 * browser never talks to Spring directly — Next rewrites (local) or Caddy (prod)
 * proxy `/api` to the backend.
 *
 * OAuth is the exception: it must open Spring on a **browser-reachable** origin
 * ({@link NEXT_PUBLIC_BACKEND_ORIGIN}) so `/oauth2/**` and `/login/oauth2/**`
 * stay on the API host during the Google/Facebook round-trip.
 *
 * Production: use `https://smolyanvote.com` (Caddy routes OAuth to Spring).
 * Never bake `http://backend:2662` — that hostname only exists inside Docker.
 */
const envSchema = z.object({
  /** Empty = same-origin (`/api/...` via Next rewrite). */
  NEXT_PUBLIC_API_URL: z.string().default(""),
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

/**
 * Browser multipart uploads (podcast audio) must hit Spring directly — the Next.js
 * dev proxy drops long-running large-body requests (`socket hang up` → HTTP 500).
 */
export function resolveDirectApiUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${stripTrailingSlash(env.NEXT_PUBLIC_BACKEND_ORIGIN)}${normalized}`;
}

/** Full-page OAuth start — must hit Spring, not the Next UI. */
export function resolveOAuthStartUrl(provider: "google" | "facebook"): string {
  const origin = stripTrailingSlash(env.NEXT_PUBLIC_BACKEND_ORIGIN);
  // Guard: Docker-internal hostnames are unreachable from the browser.
  // Fall back to same-origin `/api/...` (Caddy/Next proxy → Spring).
  if (/:\/\/backend(?::|\/|$)/i.test(origin)) {
    return `/api/v1/auth/oauth/start?provider=${provider}`;
  }
  return `${origin}/api/v1/auth/oauth/start?provider=${provider}`;
}

/** Browser-native WebSocket URL (ws/wss) for plain Spring endpoints (no SockJS). */
export function resolveNativeWsUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const publicBase = env.NEXT_PUBLIC_API_URL.trim();

  if (publicBase) {
    const wsBase = stripTrailingSlash(publicBase)
      .replace(/^http:/i, "ws:")
      .replace(/^https:/i, "wss:");
    return `${wsBase}${normalized}`;
  }

  if (typeof window === "undefined") {
    const internal =
      process.env.API_INTERNAL_URL?.trim() ||
      env.NEXT_PUBLIC_BACKEND_ORIGIN ||
      "http://localhost:2662";
    const wsBase = stripTrailingSlash(internal)
      .replace(/^http:/i, "ws:")
      .replace(/^https:/i, "wss:");
    return `${wsBase}${normalized}`;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}${normalized}`;
}
