import { distanceKm } from "./geo";
import type { Signal } from "../types";

/** Active signals within 500m and same category (max 4). */
export function findSimilarNearby(signal: Signal, dataset: Signal[]): Signal[] {
  return dataset
    .filter(
      (s) =>
        s.id !== signal.id &&
        s.isActive &&
        !s.isResolved &&
        s.category === signal.category &&
        distanceKm(signal.latitude, signal.longitude, s.latitude, s.longitude) <= 0.5,
    )
    .map((s) => ({
      ...s,
      distanceKm: distanceKm(signal.latitude, signal.longitude, s.latitude, s.longitude),
    }))
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
    .slice(0, 4);
}
