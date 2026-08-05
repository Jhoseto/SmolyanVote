"use client";

import { useEffect } from "react";

/** Loads non-critical CSS after first paint (e.g. flag-icons in language dropdown). */
export function DeferredStylesheet({
  href,
  idleTimeoutMs = 2500,
  matchMedia,
}: {
  href: string;
  idleTimeoutMs?: number;
  /** When set, inject only if this media query matches (mobile-only deferrals). */
  matchMedia?: string;
}) {
  useEffect(() => {
    if (matchMedia && !window.matchMedia(matchMedia).matches) return;

    const existing = document.querySelector<HTMLLinkElement>(`link[rel="stylesheet"][href="${href}"]`);
    if (existing) return;

    const schedule =
      typeof requestIdleCallback === "function"
        ? (cb: () => void) => requestIdleCallback(cb, { timeout: idleTimeoutMs })
        : (cb: () => void) => window.setTimeout(cb, Math.min(idleTimeoutMs, 800));

    const idleId = schedule(() => {
      if (matchMedia && !window.matchMedia(matchMedia).matches) return;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    });

    return () => {
      if (typeof cancelIdleCallback === "function" && typeof idleId === "number") {
        cancelIdleCallback(idleId);
      } else {
        window.clearTimeout(idleId as number);
      }
    };
  }, [href, idleTimeoutMs, matchMedia]);

  return null;
}
