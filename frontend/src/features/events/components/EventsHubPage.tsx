"use client";

import { useEffect, useMemo, useRef } from "react";
import { Container, EmptyState, ErrorState, LogoLoader } from "@/shared/ui";
import { useAuth } from "@/shared/lib/authContext";
import { useEventsFilters } from "../hooks/useEventsFilters";
import { useEventsCatalog } from "../hooks/useEvents";
import { filterEventsCatalog } from "../lib/filterEventsCatalog";
import { EventsHero } from "./EventsHero";
import { EventsFilters } from "./EventsFilters";
import { EventCard } from "./EventCard";
import { EventsPagination } from "./EventsPagination";

export function EventsHubPage() {
  const { isAuthenticated, user } = useAuth();
  const [filters, setFilters] = useEventsFilters();
  const { data, isPending, isError, refetch } = useEventsCatalog();
  const eventsListRef = useRef<HTMLDivElement>(null);
  const skipPageScrollRef = useRef(true);

  const page = useMemo(() => {
    if (!data) return null;
    return filterEventsCatalog(
      data.events,
      {
        search: filters.search,
        location: filters.location,
        type: filters.type,
        status: filters.status,
        sort: filters.sort,
        popularity: filters.popularity,
        datePeriod: filters.datePeriod,
        quickFilter: filters.quickFilter,
        page: filters.page,
      },
      {
        followingUsernames: data.followingUsernames,
        votedKeys: data.votedKeys,
        currentUsername: user?.username ?? null,
      },
    );
  }, [data, filters, user?.username]);

  useEffect(() => {
    if (page && page.totalElements > 0 && filters.page !== page.page) {
      void setFilters({ page: page.page });
    }
  }, [page, filters.page, setFilters]);

  useEffect(() => {
    if (skipPageScrollRef.current) {
      skipPageScrollRef.current = false;
      return;
    }
    eventsListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [filters.page]);

  return (
    <>
      <EventsHero />

      <Container className="flex flex-col gap-8 py-10">
        <div className="flex flex-col gap-4">
          <EventsFilters />

          {isAuthenticated && (
            <div className="flex flex-wrap gap-2">
              <QuickFilterChip
                active={filters.quickFilter === "my-events"}
                label="Моите събития"
                icon="bi-person-fill"
                onClick={() =>
                  setFilters({
                    quickFilter: filters.quickFilter === "my-events" ? null : "my-events",
                    page: 0,
                  })
                }
              />
              <QuickFilterChip
                active={filters.quickFilter === "following"}
                label="От следвани"
                icon="bi-people-fill"
                onClick={() =>
                  setFilters({
                    quickFilter: filters.quickFilter === "following" ? null : "following",
                    page: 0,
                  })
                }
              />
              <QuickFilterChip
                active={filters.quickFilter === "new-events"}
                label="Нови"
                icon="bi-stars"
                onClick={() =>
                  setFilters({
                    quickFilter: filters.quickFilter === "new-events" ? null : "new-events",
                    page: 0,
                  })
                }
              />
              <QuickFilterChip
                active={filters.quickFilter === "voted"}
                label="Гласувани от мен"
                icon="bi-check-circle-fill"
                onClick={() =>
                  setFilters({ quickFilter: filters.quickFilter === "voted" ? null : "voted", page: 0 })
                }
              />
              <QuickFilterChip
                active={filters.quickFilter === "not-voted"}
                label="Все още не съм гласувал"
                icon="bi-circle"
                onClick={() =>
                  setFilters({
                    quickFilter: filters.quickFilter === "not-voted" ? null : "not-voted",
                    page: 0,
                  })
                }
              />
            </div>
          )}
        </div>

        {isPending && (
          <div className="flex min-h-[280px] items-center justify-center py-16">
            <LogoLoader size="lg" label="Зареждане на събития…" />
          </div>
        )}

        {isError && (
          <ErrorState description="Събитията не можаха да се заредят." onRetry={() => refetch()} />
        )}

        {page && page.totalElements === 0 && !isPending && (
          <EmptyState
            icon="bi-calendar-x"
            title="Няма намерени събития"
            description="Опитайте да промените филтрите или търсенето."
          />
        )}

        {page && page.totalElements > 0 && (
          <div
            ref={eventsListRef}
            id="events-list"
            className="flex scroll-mt-[calc(var(--navbar-height)+20px)] flex-col gap-5"
          >
            <p className="text-sm text-[color:var(--color-text-muted)]">
              Намерени {page.totalElements} {page.totalElements === 1 ? "събитие" : "събития"}
            </p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {page.content.map((event) => (
                <EventCard key={`${event.eventType}-${event.id}`} event={event} />
              ))}
            </div>
            <EventsPagination
              page={page.page}
              totalPages={page.totalPages}
              onChange={(nextPage) => setFilters({ page: nextPage })}
            />
          </div>
        )}
      </Container>
    </>
  );
}

function QuickFilterChip({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-primary bg-primary-50 text-primary"
          : "border-border-default/60 bg-white text-[color:var(--color-text-secondary)] hover:border-primary/40 hover:text-primary"
      }`}
    >
      <i className={`bi ${icon}`} />
      {label}
    </button>
  );
}
