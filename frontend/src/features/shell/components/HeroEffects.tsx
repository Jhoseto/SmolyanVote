"use client";

import dynamic from "next/dynamic";

/** Lazy — tsparticles stays out of the initial hero JS chunk / LCP path. */
const ParticlesBackground = dynamic(
  () =>
    import("@/shared/ui/ParticlesBackground").then((m) => m.ParticlesBackground),
  { ssr: false },
);

/** Decorative hero overlay (particles). Copy lives in {@link HeroStatic}. */
export function HeroEffects() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1]"
      style={{
        WebkitMaskImage:
          "linear-gradient(90deg, #000 0%, #000 38%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.18) 72%, transparent 92%)",
        maskImage:
          "linear-gradient(90deg, #000 0%, #000 38%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.18) 72%, transparent 92%)",
      }}
    >
      <ParticlesBackground
        subtle
        theme="green"
        count={56}
        className="absolute inset-0 h-full w-full [&_canvas]:h-full [&_canvas]:w-full"
      />
    </div>
  );
}
