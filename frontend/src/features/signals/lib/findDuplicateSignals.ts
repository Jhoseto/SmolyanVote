import { distanceKm } from "./geo";
import type { Signal, SignalCategory } from "../types";

export interface DuplicateCandidate {
  signal: Signal;
  distanceKm: number;
}

/** Warn if similar title or same category within 200m. */
export function findDuplicateCandidates(
  dataset: Signal[],
  title: string,
  category: SignalCategory | undefined,
  lat: number | null,
  lng: number | null,
): DuplicateCandidate[] {
  if (!category || lat == null || lng == null) return [];
  const normalized = title.trim().toLowerCase();
  if (normalized.length < 5) return [];

  return dataset
    .filter((s) => s.isActive && !s.isResolved)
    .map((s) => ({
      signal: s,
      distanceKm: distanceKm(lat, lng, s.latitude, s.longitude),
    }))
    .filter(
      (c) =>
        c.distanceKm <= 0.2 &&
        (c.signal.category === category ||
          c.signal.title.trim().toLowerCase().includes(normalized.slice(0, 12)) ||
          normalized.includes(c.signal.title.trim().toLowerCase().slice(0, 12))),
    )
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 3);
}
