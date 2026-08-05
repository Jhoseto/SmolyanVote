import { HeroEffects } from "./HeroEffects";
import { HeroStatic } from "./HeroStatic";

/** @deprecated Prefer {@link HeroStatic} + dynamic {@link HeroEffects} on the homepage. */
export function Hero() {
  return (
    <>
      <HeroEffects />
      <HeroStatic />
    </>
  );
}
