import { describe, expect, it } from "vitest";
import { filterSignals } from "./filterSignals";
import type { Signal } from "../types";

function mockSignal(overrides: Partial<Signal> & Pick<Signal, "id">): Signal {
  return {
    title: "Test signal",
    description: "Test description long enough",
    category: "LIGHTING",
    categoryLabel: "Осветление",
    expirationDays: 7,
    activeUntil: null,
    isActive: true,
    latitude: 41.5,
    longitude: 24.7,
    imageUrl: null,
    authorId: 1,
    authorUsername: "ivan",
    authorImageUrl: null,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
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

describe("filterSignals", () => {
  const base = [
    mockSignal({ id: 1, category: "LIGHTING", title: "Лампа", isActive: true, authorId: 1, authorUsername: "ivan" }),
    mockSignal({ id: 2, category: "PARKING", title: "Паркинг", isActive: false, authorId: 2, authorUsername: "maria" }),
    mockSignal({
      id: 3,
      category: "LIGHTING",
      title: "Тъмен път",
      authorId: 3,
      authorUsername: "petar",
      hasBoosted: true,
      priorityTier: "high",
    }),
  ];

  it("hides expired when showExpired is false", () => {
    const result = filterSignals(base, { showExpired: false });
    expect(result.map((s) => s.id)).toEqual([1, 3]);
  });

  it("filters by category", () => {
    const result = filterSignals(base, { category: "PARKING", showExpired: true });
    expect(result.map((s) => s.id)).toEqual([2]);
  });

  it("filters mineOnly by currentUserId", () => {
    const result = filterSignals(base, { mineOnly: true, currentUserId: 1, showExpired: true });
    expect(result.map((s) => s.id)).toEqual([1]);
  });

  it("filters boostedOnly", () => {
    const result = filterSignals(base, { boostedOnly: true, showExpired: true });
    expect(result.map((s) => s.id)).toEqual([3]);
  });

  it("filters highPriorityOnly", () => {
    const result = filterSignals(base, { highPriorityOnly: true, showExpired: true });
    expect(result.map((s) => s.id)).toEqual([3]);
  });

  it("matches search in title and author", () => {
    const result = filterSignals(base, { search: "ivan", showExpired: true });
    expect(result.map((s) => s.id)).toEqual([1]);
  });

  it("filters resolvedOnly", () => {
    const withResolved = [...base, mockSignal({ id: 4, isResolved: true, isActive: false, title: "Решен" })];
    const result = filterSignals(withResolved, { resolvedOnly: true, showExpired: true });
    expect(result.map((s) => s.id)).toEqual([4]);
  });

  it("hides resolved from default list", () => {
    const withResolved = [...base, mockSignal({ id: 4, isResolved: true, title: "Решен" })];
    const result = filterSignals(withResolved, { showExpired: true });
    expect(result.map((s) => s.id)).not.toContain(4);
  });
});
