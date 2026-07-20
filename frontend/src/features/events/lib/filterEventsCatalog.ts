import type {
  EventDatePeriod,
  EventKind,
  EventListItem,
  EventPopularityFilter,
  EventQuickFilter,
  EventSortOption,
  EventStatusFilter,
} from "../types";

export const EVENTS_PAGE_SIZE = 12;

export interface EventsCatalogFilters {
  search: string;
  location: string;
  type: EventKind | null;
  status: EventStatusFilter | null;
  sort: EventSortOption;
  popularity: EventPopularityFilter | null;
  datePeriod: EventDatePeriod | null;
  quickFilter: EventQuickFilter | null;
  page: number;
}

export interface EventsCatalogMeta {
  followingUsernames: string[];
  votedKeys: string[];
  currentUsername: string | null;
}

export interface FilteredEventsPage {
  content: EventListItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

function eventKey(event: EventListItem): string {
  return `${event.eventType}:${event.id}`;
}

function matchesType(event: EventListItem, type: EventKind): boolean {
  if (type === "event") return event.eventType === "SIMPLEEVENT";
  if (type === "referendum") return event.eventType === "REFERENDUM";
  return event.eventType === "MULTI_POLL";
}

function matchesStatus(event: EventListItem, status: EventStatusFilter): boolean {
  if (status === "active") return event.eventStatus === "ACTIVE";
  return event.eventStatus === "INACTIVE";
}

function periodStart(period: EventDatePeriod): Date {
  const now = new Date();
  if (period === "last-7-days") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (period === "last-month") {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 1);
    return d;
  }
  const d = new Date(now);
  d.setFullYear(d.getFullYear() - 1);
  return d;
}

function matchesQuickFilter(
  event: EventListItem,
  quickFilter: EventQuickFilter,
  meta: EventsCatalogMeta,
): boolean {
  switch (quickFilter) {
    case "my-events":
      return (
        !!meta.currentUsername &&
        event.creatorName.toLowerCase() === meta.currentUsername.toLowerCase()
      );
    case "following": {
      const following = new Set(meta.followingUsernames.map((u) => u.toLowerCase()));
      return following.has(event.creatorName.toLowerCase());
    }
    case "new-events":
      return new Date(event.createdAt).getTime() >= periodStart("last-7-days").getTime();
    case "voted":
      return meta.votedKeys.includes(eventKey(event));
    case "not-voted":
      return !meta.votedKeys.includes(eventKey(event));
    default:
      return true;
  }
}

function compareEvents(
  a: EventListItem,
  b: EventListItem,
  sort: EventSortOption,
  popularity: EventPopularityFilter | null,
): number {
  if (popularity === "most-viewed") {
    return b.viewCounter - a.viewCounter || b.createdAt.localeCompare(a.createdAt);
  }
  if (popularity === "most-voted" || popularity === "most-commented") {
    return b.totalVotes - a.totalVotes || b.createdAt.localeCompare(a.createdAt);
  }

  switch (sort) {
    case "date-asc":
      return a.createdAt.localeCompare(b.createdAt);
    case "popularity":
      return b.totalVotes - a.totalVotes || b.createdAt.localeCompare(a.createdAt);
    case "name":
      return a.title.localeCompare(b.title, "bg", { sensitivity: "base" });
    case "date-desc":
    default:
      return b.createdAt.localeCompare(a.createdAt);
  }
}

/** Pure client-side filter → sort → paginate over the full events catalog. */
export function filterEventsCatalog(
  events: EventListItem[],
  filters: EventsCatalogFilters,
  meta: EventsCatalogMeta,
): FilteredEventsPage {
  const search = filters.search.trim().toLowerCase().slice(0, 100);

  let filtered = events.filter((event) => {
    if (search) {
      const haystack = `${event.title} ${event.description} ${event.creatorName}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    if (filters.location && event.location !== filters.location) return false;
    if (filters.type && !matchesType(event, filters.type)) return false;
    if (filters.status && !matchesStatus(event, filters.status)) return false;
    if (filters.datePeriod) {
      if (new Date(event.createdAt).getTime() < periodStart(filters.datePeriod).getTime()) {
        return false;
      }
    }
    if (filters.quickFilter && !matchesQuickFilter(event, filters.quickFilter, meta)) {
      return false;
    }
    return true;
  });

  filtered = [...filtered].sort((a, b) =>
    compareEvents(a, b, filters.sort, filters.popularity),
  );

  const totalElements = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / EVENTS_PAGE_SIZE));
  const page = Math.min(Math.max(0, filters.page), Math.max(0, totalPages - 1));
  const start = page * EVENTS_PAGE_SIZE;
  const content = filtered.slice(start, start + EVENTS_PAGE_SIZE);

  return {
    content,
    page,
    size: EVENTS_PAGE_SIZE,
    totalElements,
    totalPages: totalElements === 0 ? 0 : totalPages,
    hasNext: start + EVENTS_PAGE_SIZE < totalElements,
    hasPrevious: page > 0,
  };
}
