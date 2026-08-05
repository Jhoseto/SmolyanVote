"use client";

import { useEffect } from "react";

/** Loads non-critical CSS after first paint (e.g. flag-icons in language dropdown). */
export function DeferredStylesheet({ href }: { href: string }) {
  useEffect(() => {
    const existing = document.querySelector<HTMLLinkElement>(`link[rel="stylesheet"][href="${href}"]`);
    if (existing) return;

    const schedule =
      typeof requestIdleCallback === "function"
        ? (cb: () => void) => requestIdleCallback(cb, { timeout: 2500 })
        : (cb: () => void) => window.setTimeout(cb, 1200);

    const idleId = schedule(() => {
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
  }, [href]);

  return null;
}
