import type { Signal, SignalCategory, PriorityTier } from "../types";

export type { PriorityTier };

function percentileThreshold(sortedCounts: number[], percentile: number): number {
  if (sortedCounts.length === 0) return 0;
  const idx = (sortedCounts.length - 1) * percentile;
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sortedCounts[lower] ?? 0;
  const weight = idx - lower;
  return (sortedCounts[lower] ?? 0) * (1 - weight) + (sortedCounts[upper] ?? 0) * weight;
}

/**
 * Dynamic priority tiers per category (tertiles on active signals only).
 * Thresholds come from the full dataset pool, not the filtered subset.
 */
export function computePriorityLevels(signals: Signal[]): Map<number, PriorityTier> {
  const result = new Map<number, PriorityTier>();
  const byCategory = new Map<SignalCategory, Signal[]>();

  for (const s of signals) {
    if (!s.isActive) continue;
    const list = byCategory.get(s.category) ?? [];
    list.push(s);
    byCategory.set(s.category, list);
  }

  for (const group of byCategory.values()) {
    const sorted = [...group].sort((a, b) => a.priorityBoostCount - b.priorityBoostCount);
    const n = sorted.length;

    if (n === 0) continue;

    if (n === 1) {
      result.set(sorted[0]!.id, sorted[0]!.priorityBoostCount >= 1 ? "high" : "low");
      continue;
    }

    if (n === 2) {
      result.set(sorted[0]!.id, "low");
      result.set(sorted[1]!.id, "high");
      continue;
    }

    const counts = sorted.map((s) => s.priorityBoostCount);
    const p33 = percentileThreshold(counts, 0.33);
    const p66 = percentileThreshold(counts, 0.66);

    for (const s of group) {
      const c = s.priorityBoostCount;
      if (c <= p33) result.set(s.id, "low");
      else if (c <= p66) result.set(s.id, "medium");
      else result.set(s.id, "high");
    }
  }

  return result;
}

export function applyPriorityTiers(signals: Signal[]): Signal[] {
  const tiers = computePriorityLevels(signals);
  return signals.map((s) => ({
    ...s,
    priorityTier: s.isActive ? (tiers.get(s.id) ?? "low") : null,
  }));
}

export function priorityLabel(tier: PriorityTier): string {
  switch (tier) {
    case "high":
      return "Висок приоритет";
    case "medium":
      return "Среден приоритет";
    default:
      return "Нисък приоритет";
  }
}

export function priorityShortLabel(tier: PriorityTier): string {
  switch (tier) {
    case "high":
      return "Висок";
    case "medium":
      return "Среден";
    default:
      return "Нисък";
  }
}
