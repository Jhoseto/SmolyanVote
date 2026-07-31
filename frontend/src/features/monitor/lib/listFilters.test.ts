import { describe, expect, it } from "vitest";
import {
  DEFAULT_MONITOR_LIST_FILTERS,
  filterAndSortMonitorItems,
  type MonitorListFilters,
} from "./listFilters";
import type { MonitorFeedItem } from "../types";

const sample: MonitorFeedItem[] = [
  {
    id: "1",
    itemType: "contract",
    title: "Ремонт път",
    shortSummary: "А",
    category: "Строителство",
    riskScore: 80,
    riskFlags: [{ code: "SINGLE_BID", label: "Единствена оферта" }],
    amountEur: 200_000,
    date: "2026-07-01",
    sourceUrl: null,
    publishedAt: null,
  },
  {
    id: "2",
    itemType: "document",
    title: "Решение ОбС",
    shortSummary: "Б",
    category: "ОбС",
    riskScore: null,
    riskFlags: [],
    amountEur: null,
    date: "2026-06-15",
    sourceUrl: null,
    publishedAt: "2026-06-15",
  },
  {
    id: "3",
    itemType: "contract",
    title: "Зелени зони",
    shortSummary: "В",
    category: "Екология",
    riskScore: 45,
    riskFlags: [{ code: "HIGH_VALUE", label: "Висока стойност" }],
    amountEur: 15_000,
    date: "2026-07-20",
    sourceUrl: null,
    publishedAt: null,
  },
];

describe("filterAndSortMonitorItems", () => {
  it("filters by item type and search text", () => {
    const filters: MonitorListFilters = {
      ...DEFAULT_MONITOR_LIST_FILTERS,
      itemType: "contract",
      search: "ремонт",
    };
    const out = filterAndSortMonitorItems(sample, filters);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("1");
  });

  it("sorts by amount descending", () => {
    const filters: MonitorListFilters = {
      ...DEFAULT_MONITOR_LIST_FILTERS,
      sort: "amount-desc",
      itemType: "contract",
    };
    const out = filterAndSortMonitorItems(sample, filters);
    expect(out.map((i) => i.id)).toEqual(["1", "3"]);
  });

  it("filters by minimum risk and flag code", () => {
    const filters: MonitorListFilters = {
      ...DEFAULT_MONITOR_LIST_FILTERS,
      minRisk: 40,
      riskFlag: "SINGLE_BID",
    };
    const out = filterAndSortMonitorItems(sample, filters);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("1");
  });
});
