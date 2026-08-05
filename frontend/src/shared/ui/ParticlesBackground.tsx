"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Particles, ParticlesProvider } from "@tsparticles/react";
import type { ISourceOptions } from "@tsparticles/engine";
import { registerParticlesEngine } from "@/shared/lib/particlesEngine";

export type ParticlesTheme = "green" | "orange" | "cyan" | "white";

const THEMES: Record<ParticlesTheme, { particleColor: string; lineColor: string }> = {
  green: { particleColor: "#19861c", lineColor: "#19861c" },
  orange: { particleColor: "#FB7E14", lineColor: "#E86A11" },
  cyan: { particleColor: "#17CBEA", lineColor: "#0EA5E9" },
  white: { particleColor: "#ffffff", lineColor: "#ffffff" },
};

interface ParticlesBackgroundProps {
  theme?: ParticlesTheme;
  count?: number;
  className?: string;
  /**
   * Soft, low-CPU mode for light heroes (home page).
   * Deferred init + pause when off-screen; smooth slow drift at 60fps.
   */
  subtle?: boolean;
}

/** React port of v1 `particles-background.js` (tsParticles instead of particles.js). */
export function ParticlesBackground({
  theme = "green",
  count = 80,
  className = "absolute inset-0",
  subtle = false,
}: ParticlesBackgroundProps) {
  const reactId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const { particleColor, lineColor } = THEMES[theme];
  const isWhite = theme === "white";
  const [ready, setReady] = useState(!subtle);
  const [inView, setInView] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (!subtle) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setReduceMotion(true);
      return;
    }

    let cancelled = false;
    const enable = () => {
      if (!cancelled) setReady(true);
    };

    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const idleTimeout = mobile ? 2200 : 600;

    // Defer until idle so hero image + text paint first.
    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(enable, { timeout: idleTimeout });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(idleId);
      };
    }

    const timeoutId = window.setTimeout(enable, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [subtle]);

  // Pause entirely when scrolled away — zero GPU/CPU cost off-screen.
  useEffect(() => {
    if (!subtle || !ready) return;
    const el = containerRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "80px", threshold: 0.02 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [subtle, ready]);

  const options = useMemo<ISourceOptions>(
    () => ({
      fullScreen: { enable: false },
      // 60fps + slow drift = smooth premium motion (30fps was the choppiness).
      fpsLimit: 60,
      pauseOnBlur: true,
      particles: {
        // Fewer dots → far cheaper link graph; keep opacity a bit higher to compensate.
        number: { value: subtle ? Math.min(count, 40) : count },
        color: { value: particleColor },
        shape: { type: "circle" },
        opacity: {
          value: subtle ? 0.58 : isWhite ? 0.7 : 0.5,
        },
        size: { value: subtle ? 2.5 : 3 },
        links: {
          enable: true,
          distance: subtle ? 120 : 150,
          color: lineColor,
          opacity: subtle ? 0.4 : isWhite ? 0.6 : 0.4,
          width: 1,
        },
        move: subtle
          ? {
              enable: true,
              speed: 0.35,
              direction: "none",
              random: false,
              straight: false,
              outModes: { default: "bounce" },
            }
          : {
              enable: true,
              speed: 3,
            },
      },
      interactivity: {
        events: {
          onHover: { enable: !subtle, mode: "repulse" },
          onClick: { enable: !subtle, mode: "push" },
        },
      },
      // Retina doubles canvas pixels — skip in subtle mode to cut GPU work.
      detectRetina: !subtle,
    }),
    [count, particleColor, lineColor, isWhite, subtle],
  );

  if (reduceMotion || !ready) {
    return subtle ? <div ref={containerRef} className={className} aria-hidden /> : null;
  }

  return (
    <div ref={containerRef} className={className} aria-hidden>
      {inView ? (
        <ParticlesProvider init={registerParticlesEngine}>
          <Particles
            id={`particles-${theme}-${reactId}`}
            options={options}
            className="h-full w-full [&_canvas]:h-full [&_canvas]:w-full"
          />
        </ParticlesProvider>
      ) : null}
    </div>
  );
}
