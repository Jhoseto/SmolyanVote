"use client";

import dynamic from "next/dynamic";

const HeroEffects = dynamic(
  () => import("./HeroEffects").then((m) => m.HeroEffects),
  { ssr: false },
);

/** Deferred particles overlay — keeps tsparticles off the homepage critical JS path. */
export function HeroEffectsGate() {
  return <HeroEffects />;
}
