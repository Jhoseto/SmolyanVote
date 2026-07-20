import type { Engine } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";

/**
 * Module-level stable reference, required by `ParticlesProvider` — passing a
 * fresh arrow function on every render throws ("init callback must be stable
 * across the app lifecycle") once the engine singleton has started loading.
 */
export async function registerParticlesEngine(engine: Engine): Promise<void> {
  await loadSlim(engine);
}
