import type { MonitorFeedItem } from "../types";

export type MonitorSortKey =
  | "newest"
  | "oldest"
  | "amount-desc"
  | "amount-asc"
  | "risk-desc"
  | "risk-asc"
  | "title-asc";

export type MonitorDateRange = "" | "week" | "month" | "quarter" | "year";

export type MonitorItemTypeFilter = "" | "contract" | "document";

export interface MonitorListFilters {
  search: string;
  sort: MonitorSortKey;
  itemType: MonitorItemTypeFilter;
  category: string;
  minRisk: number;
  minAmount: number;
  riskFlag: string;
  dateRange: MonitorDateRange;
}

export const DEFAULT_MONITOR_LIST_FILTERS: MonitorListFilters = {
  search: "",
  sort: "newest",
  itemType: "",
  category: "",
  minRisk: 0,
  minAmount: 0,
  riskFlag: "",
  dateRange: "",
};

export const MONITOR_SORT_LABELS: Record<MonitorSortKey, string> = {
  newest: "Най-нови",
  oldest: "Най-стари",
  "amount-desc": "Най-голяма сума",
  "amount-asc": "Най-малка сума",
  "risk-desc": "Най-висок риск",
  "risk-asc": "Най-нисък риск",
  "title-asc": "По заглавие (А–Я)",
};

export const MONITOR_DATE_RANGE_LABELS: Record<MonitorDateRange, string> = {
  "": "Всяко време",
  week: "Последна седмица",
  month: "Последен месец",
  quarter: "Последни 3 месеца",
  year: "Последна година",
};

export const MONITOR_AMOUNT_THRESHOLDS = [
  { value: 0, label: "Всяка сума" },
  { value: 10_000, label: "≥ 10 000 €" },
  { value: 50_000, label: "≥ 50 000 €" },
  { value: 100_000, label: "≥ 100 000 €" },
  { value: 500_000, label: "≥ 500 000 €" },
] as const;

export const MONITOR_RISK_THRESHOLDS = [
  { value: 0, label: "Всякакъв риск" },
  { value: 40, label: "Риск ≥ 40" },
  { value: 60, label: "Риск ≥ 60" },
  { value: 80, label: "Риск ≥ 80" },
] as const;

function itemDate(item: MonitorFeedItem): number {
  const raw = item.date ?? item.publishedAt;
  if (!raw) return 0;
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : 0;
}

function cutoffForRange(range: MonitorDateRange): number {
  if (!range) return 0;
  const now = Date.now();
  const day = 86_400_000;
  switch (range) {
    case "week":
      return now - 7 * day;
    case "month":
      return now - 30 * day;
    case "quarter":
      return now - 92 * day;
    case "year":
      return now - 365 * day;
    default:
      return 0;
  }
}

export function collectCategories(items: MonitorFeedItem[]): string[] {
  const set = new Set<string>();
  for (const item of items) {
    if (item.category?.trim()) set.add(item.category.trim());
  }
  return [...set].sort((a, b) => a.localeCompare(b, "bg"));
}

export function collectRiskFlags(items: MonitorFeedItem[]): { code: string; label: string }[] {
  const map = new Map<string, string>();
  for (const item of items) {
    for (const flag of item.riskFlags) {
      if (!map.has(flag.code)) map.set(flag.code, flag.label);
    }
  }
  return [...map.entries()]
    .map(([code, label]) => ({ code, label }))
    .sort((a, b) => a.label.localeCompare(b.label, "bg"));
}

export function countActiveMonitorFilters(filters: MonitorListFilters): number {
  let n = 0;
  if (filters.search.trim()) n++;
  if (filters.sort !== DEFAULT_MONITOR_LIST_FILTERS.sort) n++;
  if (filters.itemType) n++;
  if (filters.category) n++;
  if (filters.minRisk > 0) n++;
  if (filters.minAmount > 0) n++;
  if (filters.riskFlag) n++;
  if (filters.dateRange) n++;
  return n;
}

export function filterAndSortMonitorItems(
  items: MonitorFeedItem[],
  filters: MonitorListFilters,
): MonitorFeedItem[] {
  const q = filters.search.trim().toLowerCase();
  const cutoff = cutoffForRange(filters.dateRange);

  let out = items.filter((item) => {
    if (filters.itemType && item.itemType !== filters.itemType) return false;
    if (filters.category && item.category !== filters.category) return false;
    if (filters.minRisk > 0 && (item.riskScore ?? 0) < filters.minRisk) return false;
    if (filters.minAmount > 0 && (item.amountEur ?? 0) < filters.minAmount) return false;
    if (filters.riskFlag && !item.riskFlags.some((f) => f.code === filters.riskFlag)) return false;
    if (cutoff > 0 && itemDate(item) < cutoff) return false;
    if (q) {
      const hay = `${item.title} ${item.shortSummary ?? ""} ${item.registryTitle ?? ""} ${item.category ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  out = [...out].sort((a, b) => {
    switch (filters.sort) {
      case "oldest":
        return itemDate(a) - itemDate(b);
      case "amount-desc":
        return (b.amountEur ?? 0) - (a.amountEur ?? 0);
      case "amount-asc":
        return (a.amountEur ?? 0) - (b.amountEur ?? 0);
      case "risk-desc":
        return (b.riskScore ?? 0) - (a.riskScore ?? 0);
      case "risk-asc":
        return (a.riskScore ?? 0) - (b.riskScore ?? 0);
      case "title-asc":
        return a.title.localeCompare(b.title, "bg");
      case "newest":
      default:
        return itemDate(b) - itemDate(a);
    }
  });

  return out;
}
