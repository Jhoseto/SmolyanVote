import type { Signal, SignalSortOption } from "../types";

/** Client-side sort — priority uses boost count as primary key. */
export function sortSignals(signals: Signal[], sort: SignalSortOption): Signal[] {
  const copy = [...signals];
  switch (sort) {
    case "oldest":
      return copy.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    case "popular":
      return copy.sort((a, b) => {
        const boost = b.priorityBoostCount - a.priorityBoostCount;
        if (boost !== 0) return boost;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    case "viewed":
      return copy.sort((a, b) => {
        const views = b.viewsCount - a.viewsCount;
        if (views !== 0) return views;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    case "distance":
      return copy.sort((a, b) => {
        const da = a.distanceKm ?? Infinity;
        const db = b.distanceKm ?? Infinity;
        if (da !== db) return da - db;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    case "newest":
    default:
      return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}
