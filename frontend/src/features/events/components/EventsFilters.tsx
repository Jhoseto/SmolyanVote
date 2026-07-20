"use client";

import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useEventsFilters } from "../hooks/useEventsFilters";
import { LOCATIONS } from "../data/locations";
import type { EventKind } from "../types";

const TYPE_TABS: { value: EventKind | ""; label: string; icon: string }[] = [
  { value: "", label: "Всички", icon: "bi-grid-fill" },
  { value: "event", label: "Събития", icon: "bi-calendar-event" },
  { value: "referendum", label: "Референдуми", icon: "bi-check2-square" },
  { value: "poll", label: "Анкети", icon: "bi-bar-chart-steps" },
];

const selectClass =
  "h-10 rounded-[var(--radius-md)] border border-border-default/60 bg-white px-3 text-sm text-[color:var(--color-text-primary)] outline-none transition-colors focus:border-primary";

export function EventsFilters() {
  const [filters, setFilters] = useEventsFilters();
  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput, 250);

  // Keep local input in sync when filters are cleared / URL changes externally.
  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setFilters({ search: debouncedSearch || null, page: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the debounced value, not filters.search
  }, [debouncedSearch]);

  const hasActiveFilters =
    !!filters.search ||
    !!filters.location ||
    !!filters.type ||
    !!filters.status ||
    !!filters.popularity ||
    !!filters.datePeriod ||
    !!filters.quickFilter ||
    filters.sort !== "date-desc";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.value || "all"}
            type="button"
            onClick={() => setFilters({ type: tab.value || null, page: 0 })}
            className={cn(
              "inline-flex items-center gap-2 rounded-[var(--radius-pill)] px-4 py-2 text-sm font-medium transition-colors",
              (filters.type ?? "") === tab.value
                ? "bg-[image:var(--gradient-primary)] text-white shadow-[var(--shadow-md)]"
                : "bg-white text-[color:var(--color-text-secondary)] border border-border-default/60 hover:border-primary/40 hover:text-primary",
            )}
          >
            <i className={cn("bi", tab.icon)} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <i className="bi bi-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-text-muted)]" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Търсене по заглавие или описание…"
            className="h-10 w-full rounded-[var(--radius-md)] border border-border-default/60 bg-white pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary"
          />
        </div>

        <select
          value={filters.location}
          onChange={(e) => setFilters({ location: e.target.value || null, page: 0 })}
          className={cn(selectClass, "min-w-[150px]")}
        >
          <option value="">Всички населени места</option>
          {LOCATIONS.map((loc) => (
            <option key={loc.value} value={loc.value}>
              {loc.label}
            </option>
          ))}
        </select>

        <select
          value={filters.status ?? ""}
          onChange={(e) => setFilters({ status: (e.target.value || null) as never, page: 0 })}
          className={selectClass}
        >
          <option value="">Всеки статус</option>
          <option value="active">Активни</option>
          <option value="inactive">Приключили</option>
        </select>

        <select
          value={filters.popularity ?? ""}
          onChange={(e) => setFilters({ popularity: (e.target.value || null) as never, page: 0 })}
          className={selectClass}
        >
          <option value="">Популярност</option>
          <option value="most-voted">Най-гласувани</option>
          <option value="most-viewed">Най-разглеждани</option>
          <option value="most-commented">Най-коментирани</option>
        </select>

        <select
          value={filters.datePeriod ?? ""}
          onChange={(e) => setFilters({ datePeriod: (e.target.value || null) as never, page: 0 })}
          className={selectClass}
        >
          <option value="">Всяко време</option>
          <option value="last-7-days">Последните 7 дни</option>
          <option value="last-month">Последният месец</option>
          <option value="last-year">Последната година</option>
        </select>

        <select
          value={filters.sort}
          onChange={(e) => setFilters({ sort: e.target.value as never, page: 0 })}
          className={selectClass}
        >
          <option value="date-desc">Най-нови</option>
          <option value="date-asc">Най-стари</option>
          <option value="popularity">Най-гласувани</option>
          <option value="name">По заглавие</option>
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setSearchInput("");
              setFilters({
                search: null,
                location: null,
                type: null,
                status: null,
                popularity: null,
                datePeriod: null,
                quickFilter: null,
                sort: "date-desc",
                page: 0,
              });
            }}
            className="inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-md)] px-3 text-sm font-medium text-[color:var(--color-text-secondary)] hover:text-primary"
          >
            <i className="bi bi-x-circle" />
            Изчисти филтрите
          </button>
        )}
      </div>
    </div>
  );
}
