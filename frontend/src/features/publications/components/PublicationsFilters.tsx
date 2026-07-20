"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { cn } from "@/shared/lib/cn";
import { useAuth } from "@/shared/lib/authContext";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { usePublicationsFilters } from "../hooks/usePublicationsFilters";
import { CATEGORIES } from "../data/categories";
import { AuthorSearchFilter } from "./AuthorSearchFilter";

const selectClass =
  "h-10 rounded-[var(--radius-md)] border border-border-default/60 bg-white px-3 text-sm text-[color:var(--color-text-primary)] outline-none transition-colors focus:border-primary";

const TIME_LABELS: Record<string, string> = {
  today: "Днес",
  week: "Тази седмица",
  month: "Този месец",
  year: "Тази година",
};

function FiltersContent() {
  const { isAuthenticated } = useAuth();
  const [filters, setFilters] = usePublicationsFilters();
  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput, 350);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setFilters({ search: debouncedSearch || null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the debounced value, not filters.search
  }, [debouncedSearch]);

  const hasActiveFilters =
    !!filters.search || !!filters.category || !!filters.time || filters.sort !== "date-desc" || filters.userIds.length > 0;

  function clearAll() {
    setSearchInput("");
    setFilters({ search: null, category: null, time: null, sort: "date-desc", userIds: [] });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilters({ category: null })}
          className={cn(
            "inline-flex items-center gap-2 rounded-[var(--radius-pill)] px-4 py-2 text-sm font-medium transition-colors",
            !filters.category
              ? "bg-[image:var(--gradient-primary)] text-white shadow-[var(--shadow-md)]"
              : "bg-white text-[color:var(--color-text-secondary)] border border-border-default/60 hover:border-primary/40 hover:text-primary",
          )}
        >
          <i className="bi bi-grid-fill" />
          Всички
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => setFilters({ category: filters.category === cat.value ? null : cat.value })}
            className={cn(
              "inline-flex items-center gap-2 rounded-[var(--radius-pill)] px-4 py-2 text-sm font-medium transition-colors",
              filters.category === cat.value
                ? "bg-[image:var(--gradient-primary)] text-white shadow-[var(--shadow-md)]"
                : "bg-white text-[color:var(--color-text-secondary)] border border-border-default/60 hover:border-primary/40 hover:text-primary",
            )}
          >
            <i className={cn("bi", cat.icon)} />
            {cat.label}
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
            placeholder="Търсене по заглавие или съдържание…"
            className="h-10 w-full rounded-[var(--radius-md)] border border-border-default/60 bg-white pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary"
          />
        </div>

        <select
          value={filters.time ?? ""}
          onChange={(e) => setFilters({ time: (e.target.value || null) as never })}
          className={selectClass}
        >
          <option value="">Всяко време</option>
          <option value="today">Днес</option>
          <option value="week">Тази седмица</option>
          <option value="month">Този месец</option>
          <option value="year">Тази година</option>
        </select>

        <select
          value={filters.sort}
          onChange={(e) => setFilters({ sort: e.target.value as never })}
          className={selectClass}
        >
          <option value="date-desc">Най-нови</option>
          <option value="date-asc">Най-стари</option>
          <option value="likes">Най-харесвани</option>
          <option value="comments">Най-коментирани</option>
          <option value="views">Най-разглеждани</option>
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-md)] px-3 text-sm font-medium text-[color:var(--color-text-secondary)] hover:text-primary"
          >
            <i className="bi bi-x-circle" />
            Изчисти филтрите
          </button>
        )}
      </div>

      {isAuthenticated && (
        <AuthorSearchFilter selectedIds={filters.userIds} onChange={(userIds) => setFilters({ userIds })} />
      )}

      {(filters.search || filters.time) && (
        <div className="flex flex-wrap gap-1.5">
          {filters.search && (
            <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-[color:var(--color-surface-muted)] px-2.5 py-1 text-xs text-[color:var(--color-text-secondary)]">
              „{filters.search}“
              <button type="button" onClick={() => setSearchInput("")} aria-label="Премахни търсенето">
                <i className="bi bi-x-lg text-[10px] hover:text-[color:var(--color-error)]" />
              </button>
            </span>
          )}
          {filters.time && (
            <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-[color:var(--color-surface-muted)] px-2.5 py-1 text-xs text-[color:var(--color-text-secondary)]">
              {TIME_LABELS[filters.time]}
              <button type="button" onClick={() => setFilters({ time: null })} aria-label="Премахни филтъра за време">
                <i className="bi bi-x-lg text-[10px] hover:text-[color:var(--color-error)]" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**Брой активни филтри — за badge-а на мобилния toggle бутон. */
function useActiveFilterCount() {
  const [filters] = usePublicationsFilters();
  return (
    (filters.search ? 1 : 0) +
    (filters.category ? 1 : 0) +
    (filters.time ? 1 : 0) +
    (filters.sort !== "date-desc" ? 1 : 0) +
    filters.userIds.length
  );
}

/**
 * Desktop: филтрите се показват inline (винаги видими). Mobile (`<lg`): скрити
 * зад toggle бутон с badge, отварят се в bottom-sheet drawer (MODERN_FRONTEND_PLAN.md
 * §Filters sidebar "mobile drawer + badge") — центриран Base UI `Dialog`, стилизиран
 * като долен sheet вместо нов drawer-primitive.
 */
export function PublicationsFilters() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const activeCount = useActiveFilterCount();

  return (
    <>
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-border-default/60 bg-white px-4 py-2.5 text-sm font-medium text-[color:var(--color-text-secondary)]"
        >
          <i className="bi bi-funnel" />
          Филтри
          {activeCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-white">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      <div className="hidden lg:block">
        <FiltersContent />
      </div>

      <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-[1090] bg-black/40 backdrop-blur-[2px] transition-opacity data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
          <Dialog.Popup className="fixed inset-x-0 bottom-0 z-[1091] outline-none">
            <div className="max-h-[80vh] overflow-y-auto rounded-t-[var(--radius-lg)] bg-white p-4 shadow-[var(--shadow-lg)] transition-all data-[starting-style]:translate-y-full data-[ending-style]:translate-y-full">
              <div className="mb-3 flex items-center justify-between">
                <Dialog.Title className="text-base font-semibold text-[color:var(--color-text-heading)]">
                  Филтри
                </Dialog.Title>
                <Dialog.Close
                  aria-label="Затвори"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-muted)]"
                >
                  <i className="bi bi-x-lg" />
                </Dialog.Close>
              </div>
              <FiltersContent />
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
