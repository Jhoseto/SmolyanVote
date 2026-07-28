import type { Signal, SignalCategory } from "../types";
import { distanceKm } from "./geo";

export type SignalTimeFilter = "" | "today" | "week" | "month";

export interface SignalFilterParams {
  search?: string;
  category?: SignalCategory | null;
  showInactive?: boolean;
  time?: SignalTimeFilter;
  mineOnly?: boolean;
  boostedOnly?: boolean;
  highPriorityOnly?: boolean;
  resolvedOnly?: boolean;
  nearMe?: boolean;
  userCoords?: { lat: number; lng: number } | null;
  currentUserId?: number | null;
}

function matchesTime(createdAt: string, time: SignalTimeFilter): boolean {
  if (!time) return true;
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const day = 86_400_000;
  if (time === "today") return created >= now - day;
  if (time === "week") return created >= now - 7 * day;
  if (time === "month") return created >= now - 30 * day;
  return true;
}

/** Client-side filter — no API round-trip on change. */
export function filterSignals(signals: Signal[], params: SignalFilterParams): Signal[] {
  const search = params.search?.trim().toLowerCase() ?? "";
  const coords = params.userCoords;
  const nearMe = params.nearMe && coords;

  if (params.mineOnly && params.currentUserId == null) {
    return [];
  }

  return signals
    .map((s) => {
      if (!nearMe) return s;
      const km = distanceKm(coords.lat, coords.lng, s.latitude, s.longitude);
      return { ...s, distanceKm: km };
    })
    .filter((s) => {
      if (params.resolvedOnly) {
        if (!s.isResolved) return false;
      } else {
        if (s.isResolved) return false;
        if (!params.showInactive && !s.isActive) return false;
      }
      if (nearMe && (s.distanceKm ?? Infinity) > 15) return false;
      if (params.category && s.category !== params.category) return false;
      if (params.mineOnly && params.currentUserId != null && s.authorId !== params.currentUserId) return false;
      if (params.boostedOnly && !s.hasBoosted) return false;
      if (params.highPriorityOnly && s.priorityTier !== "high") return false;
      if (!matchesTime(s.createdAt, params.time ?? "")) return false;
      if (!search) return true;
      const haystack = [s.title, s.description, s.authorUsername ?? "", s.categoryLabel]
        .join(" ")
        .toLowerCase();
      return haystack.includes(search);
    });
}
