"use client";

import { useId, useMemo } from "react";
import { Particles, ParticlesProvider } from "@tsparticles/react";
import type { ISourceOptions } from "@tsparticles/engine";
import { registerParticlesEngine } from "@/shared/lib/particlesEngine";

export type ParticlesTheme = "green" | "orange" | "cyan" | "white";

const THEMES: Record<ParticlesTheme, { particleColor: string; lineColor: string }> = {
  green: { particleColor: "#28a545", lineColor: "#57ec78" },
  orange: { particleColor: "#FB7E14", lineColor: "#E86A11" },
  cyan: { particleColor: "#17CBEA", lineColor: "#0EA5E9" },
  white: { particleColor: "#ffffff", lineColor: "#ffffff" },
};

interface ParticlesBackgroundProps {
  theme?: ParticlesTheme;
  count?: number;
  className?: string;
}

/** React port of v1 `particles-background.js` (tsParticles instead of particles.js). */
export function ParticlesBackground({
  theme = "green",
  count = 80,
  className = "absolute inset-0",
}: ParticlesBackgroundProps) {
  const reactId = useId();
  const { particleColor, lineColor } = THEMES[theme];
  const isWhite = theme === "white";

  const options = useMemo<ISourceOptions>(
    () => ({
      fullScreen: { enable: false },
      particles: {
        number: { value: count },
        color: { value: particleColor },
        shape: { type: "circle" },
        opacity: { value: isWhite ? 0.7 : 0.5 },
        size: { value: 3 },
        links: {
          enable: true,
          distance: 150,
          color: lineColor,
          opacity: isWhite ? 0.6 : 0.4,
          width: 1,
        },
        move: { enable: true, speed: 3 },
      },
      interactivity: {
        events: {
          onHover: { enable: true, mode: "repulse" },
          onClick: { enable: true, mode: "push" },
        },
      },
      detectRetina: true,
    }),
    [count, particleColor, lineColor, isWhite],
  );

  return (
    <ParticlesProvider init={registerParticlesEngine}>
      <Particles id={`particles-${theme}-${reactId}`} options={options} className={className} />
    </ParticlesProvider>
  );
}
