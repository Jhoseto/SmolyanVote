import { describe, expect, it } from "vitest";
import { applyPriorityTiers, computePriorityLevels } from "./computePriorityLevel";
import type { Signal } from "../types";

function mockSignal(overrides: Partial<Signal> & Pick<Signal, "id" | "category" | "priorityBoostCount">): Signal {
  return {
    title: "Test",
    description: "Test description long enough",
    categoryLabel: "Test",
    isActive: true,
    latitude: 41.5,
    longitude: 24.7,
    imageUrl: null,
    authorId: 1,
    authorUsername: "user",
    authorImageUrl: null,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    viewsCount: 0,
    commentsCount: 0,
    hasBoosted: false,
    isOwner: false,
    isResolved: false,
    resolvedByUsername: null,
    adminNotes: null,
    isSubscribed: false,
    hasReportedResolved: false,
    resolvedReportCount: 0,
    ...overrides,
  };
}

describe("computePriorityLevels", () => {
  it("assigns tiers independently per category", () => {
    const signals = [
      mockSignal({ id: 1, category: "LIGHTING", priorityBoostCount: 10 }),
      mockSignal({ id: 2, category: "LIGHTING", priorityBoostCount: 1 }),
      mockSignal({ id: 3, category: "LIGHTING", priorityBoostCount: 5 }),
      mockSignal({ id: 4, category: "PARKING", priorityBoostCount: 2 }),
      mockSignal({ id: 5, category: "PARKING", priorityBoostCount: 20 }),
      mockSignal({ id: 6, category: "PARKING", priorityBoostCount: 8 }),
    ];

    const tiers = computePriorityLevels(signals);
    expect(tiers.get(1)).toBe("high");
    expect(tiers.get(2)).toBe("low");
    // Parking high boost should be high within parking, not compared to lighting
    expect(tiers.get(5)).toBe("high");
  });

  it("handles single active signal in category", () => {
    const signals = [mockSignal({ id: 1, category: "SECURITY", priorityBoostCount: 0 })];
    const tiers = computePriorityLevels(signals);
    expect(tiers.get(1)).toBe("low");
  });

  it("skips inactive signals in percentile pool", () => {
    const withTiers = applyPriorityTiers([
      mockSignal({ id: 1, category: "OTHER", priorityBoostCount: 5, isActive: false }),
      mockSignal({ id: 2, category: "OTHER", priorityBoostCount: 1 }),
    ]);
    expect(withTiers.find((s) => s.id === 1)?.priorityTier).toBeNull();
  });
});
