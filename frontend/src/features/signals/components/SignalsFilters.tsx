"use client";

import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useSignalsFilters } from "../hooks/useSignalsFilters";
import { SIGNAL_CATEGORIES } from "../data/categories";

const selectClass =
  "h-10 rounded-[var(--radius-md)] border border-border-default/60 bg-white px-3 text-sm text-[color:var(--color-text-primary)] outline-none transition-colors focus:border-primary";

const SORT_LABELS: Record<string, string> = {
  newest: "Най-нови",
  oldest: "Най-стари",
  popular: "Най-харесвани",
  viewed: "Най-разглеждани",
};

/** Category/showExpired/search/sort/clear — mirrors legacy `signal-management.js` param names exactly. */
export function SignalsFilters({ className }: { className?: string }) {
  const [filters, setFilters] = useSignalsFilters();
  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput, 300);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setFilters({ search: debouncedSearch || null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the debounced value, not filters.search
  }, [debouncedSearch]);

  const hasActiveFilters = !!filters.search || !!filters.category || filters.showExpired || filters.sort !== "newest";

  function clearAll() {
    setSearchInput("");
    setFilters({ search: null, category: null, showExpired: false, sort: "newest" });
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2.5", className)}>
      <div className="relative min-w-[200px] flex-1">
        <i className="bi bi-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-text-muted)]" />
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Търси сигнали…"
          className="h-10 w-full rounded-[var(--radius-md)] border border-border-default/60 bg-white pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary"
        />
      </div>

      <select
        value={filters.category ?? ""}
        onChange={(e) => setFilters({ category: (e.target.value || null) as never })}
        className={selectClass}
      >
        <option value="">Всички категории</option>
        {SIGNAL_CATEGORIES.map((cat) => (
          <option key={cat.value} value={cat.value}>
            {cat.label}
          </option>
        ))}
      </select>

      <select value={filters.sort} onChange={(e) => setFilters({ sort: e.target.value as never })} className={selectClass}>
        {Object.entries(SORT_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <label className="flex h-10 items-center gap-1.5 rounded-[var(--radius-md)] border border-border-default/60 bg-white px-3 text-sm text-[color:var(--color-text-secondary)]">
        <input
          type="checkbox"
          checked={filters.showExpired}
          onChange={(e) => setFilters({ showExpired: e.target.checked })}
          className="accent-[color:var(--color-primary)]"
        />
        Изтекли
      </label>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-md)] px-3 text-sm text-[color:var(--color-text-muted)] hover:text-[color:var(--color-error)]"
        >
          <i className="bi bi-x-circle" />
          Изчисти
        </button>
      )}
    </div>
  );
}
