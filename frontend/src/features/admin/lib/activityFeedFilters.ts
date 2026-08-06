import type { ActivityItem } from "../types";

export type ActivitySortField = "timestamp" | "username" | "action" | "entityType" | "ipAddress";
export type ActivitySortDir = "asc" | "desc";
export type ActivityTimeRange = "all" | "1h" | "24h" | "today" | "7d";

export interface ActivityFeedFilters {
  /** Free-text search across text fields and IP */
  query: string;
  username: string;
  action: string;
  entityType: string;
  /** Activity category: create | interact | view | moderate | auth | other */
  typeCategory: string;
  timeRange: ActivityTimeRange;
  /** When true, hide rows without a resolved IP */
  ipOnly: boolean;
  sortField: ActivitySortField;
  sortDir: ActivitySortDir;
}

export const DEFAULT_ACTIVITY_FEED_FILTERS: ActivityFeedFilters = {
  query: "",
  username: "",
  action: "",
  entityType: "",
  typeCategory: "",
  timeRange: "all",
  ipOnly: false,
  sortField: "timestamp",
  sortDir: "desc",
};

export const ACTIVITY_TYPE_CATEGORY_LABELS: Record<string, string> = {
  create: "Създаване",
  interact: "Взаимодействие",
  view: "Преглед",
  moderate: "Модерация",
  auth: "Вход/рег.",
  other: "Друго",
};

export const ACTIVITY_TIME_RANGE_LABELS: Record<ActivityTimeRange, string> = {
  all: "Всички",
  "1h": "Последен час",
  "24h": "24 часа",
  today: "Днес",
  "7d": "7 дни",
};

export const ACTIVITY_SORT_FIELD_LABELS: Record<ActivitySortField, string> = {
  timestamp: "Дата",
  username: "Потребител",
  action: "Действие",
  entityType: "Тип обект",
  ipAddress: "IP адрес",
};

/** Full IP from REST/WS payload (camelCase or snake_case). */
export function resolveActivityIp(item: ActivityItem & { ip_address?: string | null }): string | null {
  const raw = (item.ipAddress ?? item.ip_address ?? "").trim();
  if (!raw || raw.toLowerCase() === "unknown") return null;
  return raw;
}

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase();
}

function looksLikeIpQuery(query: string): boolean {
  const q = query.trim();
  if (!q) return false;
  return q.includes(".") || q.includes(":") || /^\d+$/.test(q);
}

function matchesTimeRange(timestamp: string | null | undefined, range: ActivityTimeRange): boolean {
  if (range === "all" || !timestamp) return true;
  const ts = new Date(timestamp).getTime();
  if (Number.isNaN(ts)) return true;
  const now = Date.now();
  switch (range) {
    case "1h":
      return ts >= now - 60 * 60 * 1000;
    case "24h":
      return ts >= now - 24 * 60 * 60 * 1000;
    case "7d":
      return ts >= now - 7 * 24 * 60 * 60 * 1000;
    case "today": {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      return ts >= start.getTime();
    }
    default:
      return true;
  }
}

function activitySearchHaystack(item: ActivityItem): string {
  return [
    item.displayText,
    item.action,
    item.username,
    item.entityType,
    item.entityId != null ? String(item.entityId) : "",
    item.details,
    item.type,
    resolveActivityIp(item),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function compareStrings(a: string | null | undefined, b: string | null | undefined): number {
  return (a ?? "").localeCompare(b ?? "", "bg", { sensitivity: "base" });
}

function sortValue(item: ActivityItem, field: ActivitySortField): string | number {
  switch (field) {
    case "timestamp":
      return new Date(item.timestamp).getTime() || 0;
    case "username":
      return item.username ?? "";
    case "action":
      return item.action ?? "";
    case "entityType":
      return item.entityType ?? "";
    case "ipAddress":
      return resolveActivityIp(item) ?? "";
    default:
      return 0;
  }
}

export function hasActiveActivityFilters(filters: ActivityFeedFilters): boolean {
  return (
    !!filters.query.trim() ||
    !!filters.username ||
    !!filters.action ||
    !!filters.entityType ||
    !!filters.typeCategory ||
    filters.timeRange !== "all" ||
    filters.ipOnly ||
    filters.sortField !== DEFAULT_ACTIVITY_FEED_FILTERS.sortField ||
    filters.sortDir !== DEFAULT_ACTIVITY_FEED_FILTERS.sortDir
  );
}

export function filterAndSortActivities(
  items: ActivityItem[],
  filters: ActivityFeedFilters,
): ActivityItem[] {
  const queryNorm = normalizeSearchText(filters.query);
  const ipQuery = looksLikeIpQuery(filters.query) ? queryNorm : "";

  const filtered = items.filter((item) => {
    if (filters.ipOnly && !resolveActivityIp(item)) return false;
    if (filters.typeCategory && item.type !== filters.typeCategory) return false;
    if (filters.username && !(item.username ?? "").toLowerCase().includes(filters.username.toLowerCase())) {
      return false;
    }
    if (filters.action && item.action !== filters.action) return false;
    if (filters.entityType && item.entityType !== filters.entityType) return false;
    if (!matchesTimeRange(item.timestamp, filters.timeRange)) return false;

    if (queryNorm) {
      const ip = resolveActivityIp(item)?.toLowerCase() ?? "";
      const haystack = activitySearchHaystack(item);
      const ipMatch = ipQuery && ip.includes(ipQuery);
      const textMatch = haystack.includes(queryNorm);
      if (!textMatch && !ipMatch) return false;
    }

    return true;
  });

  const dir = filters.sortDir === "asc" ? 1 : -1;
  return [...filtered].sort((a, b) => {
    const av = sortValue(a, filters.sortField);
    const bv = sortValue(b, filters.sortField);
    if (typeof av === "number" && typeof bv === "number") {
      return (av - bv) * dir;
    }
    return compareStrings(String(av), String(bv)) * dir;
  });
}

export const ACTIVITY_PAGE_SIZE = 100;

/** Map UI filters to server-side search params (searches entire activity_logs table). */
export function activityFiltersToApiParams(
  filters: ActivityFeedFilters,
  page: number,
  size: number = ACTIVITY_PAGE_SIZE,
): Record<string, string | number | undefined> {
  return {
    query: filters.query.trim() || undefined,
    username: filters.username || undefined,
    action: filters.action || undefined,
    entityType: filters.entityType || undefined,
    typeCategory: filters.typeCategory || undefined,
    timeRange: filters.timeRange !== "all" ? filters.timeRange : undefined,
    ipOnly: filters.ipOnly ? "true" : undefined,
    page,
    size,
    sortBy: filters.sortField,
    sortDir: filters.sortDir,
  };
}

export function filtersAffectServerQuery(filters: ActivityFeedFilters, debouncedQuery: string): ActivityFeedFilters {
  return { ...filters, query: debouncedQuery };
}

export function facetsToFilterOptions(facets: {
  actions?: string[];
  entityTypes?: string[];
  usernames?: string[];
  typeCategories?: string[];
}) {
  const sortAlpha = (a: string, b: string) => a.localeCompare(b, "bg", { sensitivity: "base" });
  return {
    actions: [...(facets.actions ?? [])].sort(sortAlpha),
    entityTypes: [...(facets.entityTypes ?? [])].sort(sortAlpha),
    usernames: [...(facets.usernames ?? [])].sort(sortAlpha),
    typeCategories: [...(facets.typeCategories ?? [])].sort(sortAlpha),
  };
}
