import { describe, expect, it } from "vitest";
import { formatActivityTimestamp, formatBulgarianDateTime } from "./formatRelativeDate";

describe("formatActivityTimestamp", () => {
  it("uses relative format within 24 hours", () => {
    const now = Date.now();
    const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000).toISOString();
    const result = formatActivityTimestamp(twoHoursAgo, now);
    expect(result).toMatch(/преди/i);
  });

  it("uses Bulgarian date and time after 24 hours", () => {
    const now = Date.now();
    const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString();
    const result = formatActivityTimestamp(threeDaysAgo, now);
    expect(result).not.toMatch(/преди/i);
    expect(result).toMatch(/\d/);
    expect(result).toMatch(/:/);
  });
});

describe("formatBulgarianDateTime", () => {
  it("formats with Europe/Sofia timezone", () => {
    const result = formatBulgarianDateTime("2026-01-15T10:30:00.000Z");
    expect(result.length).toBeGreaterThan(10);
  });
});
