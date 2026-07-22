"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Avatar } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { usePublicationsFilters } from "../hooks/usePublicationsFilters";
import { CATEGORIES } from "../data/categories";
import { loadRememberedAuthors } from "../lib/selectedAuthorsStorage";

const selectClass =
  "h-10 w-full rounded-[var(--radius-md)] border border-border-default/60 bg-white px-3 text-sm text-[color:var(--color-text-primary)] outline-none transition-colors focus:border-primary";

const TIME_LABELS: Record<string, string> = {
  today: "Днес",
  week: "Тази седмица",
  month: "Този месец",
  year: "Тази година",
};

const RAIL_PRIMARY = 4;

/** Filters only — search lives in `PublicationsUnifiedSearch`. */
function FiltersContent({ stacked = false }: { stacked?: boolean }) {
  const [filters, setFilters] = usePublicationsFilters();
  const [showAllCategories, setShowAllCategories] = useState(false);

  const hasActiveFilters =
    !!filters.search ||
    !!filters.category ||
    !!filters.time ||
    filters.sort !== "date-desc" ||
    filters.userIds.length > 0 ||
    filters.author === "me";

  const selectedAuthors = loadRememberedAuthors(filters.userIds);
  const visibleCategories =
    stacked && !showAllCategories ? CATEGORIES.slice(0, RAIL_PRIMARY) : CATEGORIES;
  const hasMoreCategories = stacked && CATEGORIES.length > RAIL_PRIMARY;

  function clearAll() {
    setFilters({
      search: null,
      category: null,
      time: null,
      sort: "date-desc",
      userIds: [],
      author: null,
    });
  }

  return (
    <div className={cn("flex flex-col gap-4", stacked && "gap-3")}>
      <div className={cn("flex flex-wrap gap-2", stacked && "flex-col")}>
        <button
          type="button"
          onClick={() => setFilters({ category: null })}
          className={cn(
            "inline-flex items-center gap-2 rounded-[var(--radius-pill)] px-4 py-2 text-sm font-medium transition-colors",
            stacked && "w-full justify-start",
            !filters.category
              ? "bg-[image:var(--gradient-primary)] text-white shadow-[var(--shadow-md)]"
              : "border border-border-default/60 bg-white text-[color:var(--color-text-secondary)] hover:border-primary/40 hover:text-primary",
          )}
        >
          <i className="bi bi-grid-fill" />
          Всички
        </button>
        {visibleCategories.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => setFilters({ category: filters.category === cat.value ? null : cat.value })}
            className={cn(
              "inline-flex items-center gap-2 rounded-[var(--radius-pill)] px-4 py-2 text-sm font-medium transition-colors",
              stacked && "w-full justify-start",
              filters.category === cat.value
                ? "bg-[image:var(--gradient-primary)] text-white shadow-[var(--shadow-md)]"
                : "border border-border-default/60 bg-white text-[color:var(--color-text-secondary)] hover:border-primary/40 hover:text-primary",
            )}
          >
            <i className={cn("bi", cat.icon)} />
            {cat.label}
          </button>
        ))}
        {hasMoreCategories && (
          <button
            type="button"
            onClick={() => setShowAllCategories((v) => !v)}
            className="inline-flex w-full items-center justify-start gap-2 rounded-[var(--radius-pill)] border border-dashed border-border-default/60 px-4 py-2 text-sm font-medium text-[color:var(--color-text-muted)] hover:border-primary/40 hover:text-primary"
          >
            <i className={cn("bi", showAllCategories ? "bi-chevron-up" : "bi-three-dots")} />
            {showAllCategories ? "По-малко" : `Още ${CATEGORIES.length - RAIL_PRIMARY}`}
          </button>
        )}
      </div>

      <div className={cn("flex flex-wrap items-center gap-3", stacked && "flex-col items-stretch")}>
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
            Изчисти
          </button>
        )}
      </div>

      {(filters.search || filters.time || filters.author === "me" || selectedAuthors.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {filters.author === "me" && (
            <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary">
              Моите
              <button type="button" onClick={() => setFilters({ author: null })} aria-label="Премахни">
                <i className="bi bi-x-lg text-[10px]" />
              </button>
            </span>
          )}
          {filters.search && (
            <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-[color:var(--color-surface-muted)] px-2.5 py-1 text-xs text-[color:var(--color-text-secondary)]">
              „{filters.search}“
              <button type="button" onClick={() => setFilters({ search: null })} aria-label="Премахни търсенето">
                <i className="bi bi-x-lg text-[10px] hover:text-[color:var(--color-error)]" />
              </button>
            </span>
          )}
          {filters.time && (
            <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-[color:var(--color-surface-muted)] px-2.5 py-1 text-xs text-[color:var(--color-text-secondary)]">
              {TIME_LABELS[filters.time]}
              <button type="button" onClick={() => setFilters({ time: null })} aria-label="Премахни времето">
                <i className="bi bi-x-lg text-[10px] hover:text-[color:var(--color-error)]" />
              </button>
            </span>
          )}
          {selectedAuthors.map((author) => (
            <span
              key={author.id}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-primary-50 py-1 pl-1 pr-2 text-xs font-medium text-primary"
            >
              <Avatar username={author.username} imageUrl={author.imageUrl} size={18} />
              {author.username}
              <button
                type="button"
                onClick={() => setFilters({ userIds: filters.userIds.filter((id) => id !== author.id) })}
                aria-label={`Премахни ${author.username}`}
                className="hover:text-[color:var(--color-error)]"
              >
                <i className="bi bi-x-lg text-[10px]" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function useActiveFilterCount() {
  const [filters] = usePublicationsFilters();
  return (
    (filters.search ? 1 : 0) +
    (filters.category ? 1 : 0) +
    (filters.time ? 1 : 0) +
    (filters.sort !== "date-desc" ? 1 : 0) +
    filters.userIds.length +
    (filters.author === "me" ? 1 : 0)
  );
}

export function PublicationsFilters({ variant = "default" }: { variant?: "default" | "rail" } = {}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const activeCount = useActiveFilterCount();

  if (variant === "rail") {
    return (
      <div className="rounded-[var(--radius-lg)] border border-border-default/50 bg-white/90 p-4 shadow-[var(--shadow-sm)] backdrop-blur-sm">
        <h2 className="mb-3 font-display text-sm font-semibold text-[color:var(--color-text-heading)]">
          Филтри
        </h2>
        <FiltersContent stacked />
      </div>
    );
  }

  return (
    <>
      <div className="xl:hidden">
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

      <div className="hidden lg:block xl:hidden">
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
              <FiltersContent stacked />
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
