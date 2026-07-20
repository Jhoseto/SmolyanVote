"use client";

import { useEffect, useRef } from "react";

interface UseInfiniteScrollSentinelOptions {
  /** Called when the sentinel enters the viewport (only while `enabled`). */
  onIntersect: () => void;
  enabled: boolean;
  /** Pixels before the sentinel is visible to trigger the callback ("preload"). */
  rootMargin?: string;
}

/**
 * Returns a ref to attach to a sentinel element placed at the end of a list.
 * Fires `onIntersect` (e.g. `fetchNextPage`) as soon as it scrolls near the
 * viewport, so infinite scroll works without manual scroll-event listeners.
 */
export function useInfiniteScrollSentinel({
  onIntersect,
  enabled,
  rootMargin = "400px",
}: UseInfiniteScrollSentinelOptions) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const onIntersectRef = useRef(onIntersect);

  useEffect(() => {
    onIntersectRef.current = onIntersect;
  }, [onIntersect]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !enabled) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onIntersectRef.current();
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, rootMargin]);

  return sentinelRef;
}
