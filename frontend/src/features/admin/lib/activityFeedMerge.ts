import type { ActivityItem } from "../types";

/** Merge activity rows by id, newest first. */
export function mergeActivityItems(
  existing: ActivityItem[],
  incoming: ActivityItem[],
): ActivityItem[] {
  const map = new Map<number, ActivityItem>();
  for (const item of [...existing, ...incoming]) {
    map.set(item.id, item);
  }
  return [...map.values()].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

export function oldestActivityTimestamp(items: ActivityItem[]): Date | null {
  if (items.length === 0) return null;
  let oldest = new Date(items[0].timestamp).getTime();
  for (const item of items) {
    const ts = new Date(item.timestamp).getTime();
    if (!Number.isNaN(ts) && ts < oldest) oldest = ts;
  }
  return Number.isNaN(oldest) ? null : new Date(oldest);
}

export const ACTIVITY_PAGE_SIZE = 500;
