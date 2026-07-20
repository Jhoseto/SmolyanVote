"use client";

import { useEffect, useRef, useState } from "react";

/** Legacy `animateCounters()` port — counts up from 0 to `value` once, the first time it becomes visible. */
export function useCountUp<T extends HTMLElement = HTMLElement>(value: number, durationMs = 800) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<T>(null);
  const animated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || animated.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || animated.current) return;
        animated.current = true;
        observer.disconnect();

        const start = performance.now();
        function tick(now: number) {
          const progress = Math.min(1, (now - start) / durationMs);
          setDisplay(Math.round(progress * value));
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per mount; `value` changes shouldn't restart the animation
  }, []);

  return { ref, display };
}
