import { describe, expect, it } from "vitest";
import {
  DEFAULT_ACTIVITY_FEED_FILTERS,
  filterAndSortActivities,
  resolveActivityIp,
  type ActivityFeedFilters,
} from "./activityFeedFilters";
import type { ActivityItem } from "../types";

function item(partial: Partial<ActivityItem>): ActivityItem {
  return {
    id: 1,
    timestamp: "2026-08-06T10:00:00.000Z",
    userId: 1,
    username: "MariaTeneva",
    action: "VIEW_PUBLICATION",
    entityType: "PUBLICATION",
    entityId: 3452,
    details: null,
    ipAddress: "0:0:0:0:0:0:0:1",
    type: "view",
    displayText: "MariaTeneva view publication (PUBLICATION #3452)",
    iconClass: "bi-eye",
    colorClass: "text-info",
    ...partial,
  };
}

describe("filterAndSortActivities", () => {
  const items = [
    item({ id: 1, username: "Alice", action: "VIEW_PUBLICATION", ipAddress: "192.168.1.1" }),
    item({
      id: 2,
      username: "Bob",
      action: "LIKE_PUBLICATION",
      type: "interact",
      displayText: "Bob liked publication",
      ipAddress: "10.0.0.5",
      timestamp: "2026-08-06T11:00:00.000Z",
    }),
    item({
      id: 3,
      username: "Carol",
      action: "USER_LOGIN",
      type: "auth",
      displayText: "Carol logged in",
      ipAddress: null,
      timestamp: "2026-08-06T09:00:00.000Z",
    }),
  ];

  it("filters by global query including IP", () => {
    const filters: ActivityFeedFilters = {
      ...DEFAULT_ACTIVITY_FEED_FILTERS,
      query: "10.0.0.5",
    };
    expect(filterAndSortActivities(items, filters)).toHaveLength(1);
    expect(filterAndSortActivities(items, filters)[0].username).toBe("Bob");
  });

  it("filters by username select and type category", () => {
    const filters: ActivityFeedFilters = {
      ...DEFAULT_ACTIVITY_FEED_FILTERS,
      username: "Ali",
      typeCategory: "view",
    };
    const result = filterAndSortActivities(items, filters);
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe("Alice");
  });

  it("filters ipOnly rows", () => {
    const filters: ActivityFeedFilters = {
      ...DEFAULT_ACTIVITY_FEED_FILTERS,
      ipOnly: true,
    };
    expect(filterAndSortActivities(items, filters)).toHaveLength(2);
  });

  it("sorts ascending by username", () => {
    const filters: ActivityFeedFilters = {
      ...DEFAULT_ACTIVITY_FEED_FILTERS,
      sortField: "username",
      sortDir: "asc",
    };
    const result = filterAndSortActivities(items, filters);
    expect(result.map((i) => i.username)).toEqual(["Alice", "Bob", "Carol"]);
  });
});

describe("resolveActivityIp", () => {
  it("ignores unknown sentinel", () => {
    expect(resolveActivityIp(item({ ipAddress: "unknown" }))).toBeNull();
  });
});
