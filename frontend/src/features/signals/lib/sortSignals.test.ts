import { describe, expect, it } from "vitest";
import { sortSignals } from "./sortSignals";
import type { Signal } from "../types";

function mockSignal(overrides: Partial<Signal> & Pick<Signal, "id">): Signal {
  return {
    title: "Test",
    description: "Test description long enough",
    category: "OTHER",
    categoryLabel: "Друго",
    expirationDays: 7,
    activeUntil: null,
    isActive: true,
    latitude: 41.5,
    longitude: 24.7,
    imageUrl: null,
    authorId: 1,
    authorUsername: "user",
    authorImageUrl: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    modifiedAt: "2026-01-01T00:00:00.000Z",
    priorityBoostCount: 0,
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

describe("sortSignals", () => {
  const signals = [
    mockSignal({ id: 1, createdAt: "2026-01-01T00:00:00.000Z", priorityBoostCount: 2, viewsCount: 10 }),
    mockSignal({ id: 2, createdAt: "2026-03-01T00:00:00.000Z", priorityBoostCount: 5, viewsCount: 3 }),
    mockSignal({ id: 3, createdAt: "2026-02-01T00:00:00.000Z", priorityBoostCount: 5, viewsCount: 50 }),
  ];

  it("sorts newest first by default", () => {
    const sorted = sortSignals(signals, "newest");
    expect(sorted.map((s) => s.id)).toEqual([2, 3, 1]);
  });

  it("sorts oldest first", () => {
    const sorted = sortSignals(signals, "oldest");
    expect(sorted.map((s) => s.id)).toEqual([1, 3, 2]);
  });

  it("sorts by boost count for popular", () => {
    const sorted = sortSignals(signals, "popular");
    expect(sorted.map((s) => s.id)).toEqual([2, 3, 1]);
  });

  it("sorts by views for viewed", () => {
    const sorted = sortSignals(signals, "viewed");
    expect(sorted.map((s) => s.id)).toEqual([3, 1, 2]);
  });

  it("does not mutate the input array", () => {
    const copy = [...signals];
    sortSignals(signals, "newest");
    expect(signals).toEqual(copy);
  });
});
