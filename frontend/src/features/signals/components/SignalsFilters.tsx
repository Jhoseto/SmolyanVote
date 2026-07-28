"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useAuth } from "@/shared/lib/authContext";
import { useRequireAuth } from "@/shared/hooks/useRequireAuth";
import { useToast } from "@/shared/hooks/useToast";
import { useSignalsFilters } from "../hooks/useSignalsFilters";
import { useGeolocation } from "../hooks/useGeolocation";
import { SIGNAL_CATEGORIES } from "../data/categories";

const selectClass =
  "h-10 rounded-[var(--radius-md)] border border-border-default/40 bg-white px-3 text-sm shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10";

const SORT_LABELS: Record<string, string> = {
  newest: "Най-нови",
  oldest: "Най-стари",
  popular: "По приоритет",
  viewed: "Най-разглеждани",
};

const TIME_LABELS: Record<string, string> = {
  "": "Всяко време",
  today: "Днес",
  week: "Последна седмица",
  month: "Последен месец",
};

interface SignalsFiltersProps {
  className?: string;
  totalCount?: number;
  filteredCount?: number;
  isAdmin?: boolean;
  adminQuickMode?: boolean;
  onAdminQuickModeChange?: (value: boolean) => void;
}

function FilterChip({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-pill)] px-3 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50",
        active
          ? "bg-[image:var(--gradient-primary)] text-white shadow-[0_4px_12px_rgba(13,110,253,0.28)]"
          : "border border-border-default/40 bg-white text-[color:var(--color-text-secondary)] hover:border-primary/25 hover:bg-primary-50/50",
      )}
    >
      {children}
    </button>
  );
}

export function SignalsFilters({
  className,
  totalCount,
  filteredCount,
  isAdmin,
  adminQuickMode,
  onAdminQuickModeChange,
}: SignalsFiltersProps) {
  const [filters, setFilters] = useSignalsFilters();
  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput, 300);
  const { user } = useAuth();
  const requireAuth = useRequireAuth();
  const toast = useToast();
  const geo = useGeolocation(filters.nearMe);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setFilters({ search: debouncedSearch || null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  useEffect(() => {
    if (!filters.nearMe || geo.isLoading || !geo.error) return;
    toast.error(geo.error);
    setFilters({ nearMe: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.nearMe, geo.error, geo.isLoading]);

  const hasActiveFilters =
    !!filters.search ||
    !!filters.category ||
    filters.showInactive ||
    filters.sort !== "newest" ||
    !!filters.time ||
    filters.mineOnly ||
    filters.boostedOnly ||
    filters.highPriorityOnly ||
    filters.resolvedOnly ||
    filters.nearMe;

  function clearAll() {
    setSearchInput("");
    setFilters({
      search: null,
      category: null,
      showInactive: false,
      sort: "newest",
      time: null,
      mineOnly: false,
      boostedOnly: false,
      highPriorityOnly: false,
      resolvedOnly: false,
      nearMe: false,
    });
  }

  async function handleMineOnly() {
    if (!filters.mineOnly && !(await requireAuth("да видиш само твоите сигнали"))) return;
    setFilters({ mineOnly: !filters.mineOnly });
  }

  async function handleShareFilters() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Линкът с филтрите е копиран.");
    } catch {
      toast.error("Не успяхме да копираме линка.");
    }
  }

  return (
    <div
      id="signals-filters"
      className={cn(
        "flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border-default/30 bg-white/80 p-4 shadow-[0_4px_24px_rgba(15,23,42,0.04)] backdrop-blur-sm",
        className,
      )}
    >
      {totalCount != null && filteredCount != null && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-[color:var(--color-text-muted)]">
            Показани{" "}
            <strong className="font-semibold text-[color:var(--color-text-heading)]">{filteredCount}</strong> от{" "}
            <strong className="font-semibold text-[color:var(--color-text-heading)]">{totalCount}</strong> сигнала
          </p>
          <div className="flex items-center gap-2">
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={handleShareFilters}
                className="inline-flex items-center gap-1 text-xs font-medium text-[color:var(--color-text-muted)] hover:text-primary"
              >
                <i className="bi bi-link-45deg" />
                Сподели
              </button>
            ) : null}
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-1 text-xs font-medium text-[color:var(--color-text-muted)] hover:text-[color:var(--color-error)]"
              >
                <i className="bi bi-x-circle" />
                Изчисти
              </button>
            ) : null}
          </div>
        </div>
      )}

      <div className="relative">
        <i className="bi bi-search pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--color-text-muted)]" />
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Търси по заглавие, описание, автор…"
          className="h-11 w-full rounded-[var(--radius-lg)] border border-border-default/40 bg-[color:var(--color-surface-light)]/60 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={filters.category ?? ""}
          onChange={(e) => setFilters({ category: (e.target.value || null) as never })}
          className={cn(selectClass, "min-w-[140px] flex-1")}
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

        <select value={filters.time ?? ""} onChange={(e) => setFilters({ time: (e.target.value || null) as never })} className={selectClass}>
          {Object.entries(TIME_LABELS).map(([value, label]) => (
            <option key={value || "all"} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip active={filters.showInactive} onClick={() => setFilters({ showInactive: !filters.showInactive })}>
          <i className="bi bi-eye-slash" />
          Неактивни
        </FilterChip>
        <FilterChip active={filters.mineOnly} onClick={handleMineOnly} disabled={!user && !filters.mineOnly}>
          <i className="bi bi-person" />
          Моите
        </FilterChip>
        <FilterChip active={filters.boostedOnly} onClick={() => setFilters({ boostedOnly: !filters.boostedOnly })}>
          <i className="bi bi-arrow-up-circle" />
          Вдигнати от мен
        </FilterChip>
        <FilterChip active={filters.highPriorityOnly} onClick={() => setFilters({ highPriorityOnly: !filters.highPriorityOnly })}>
          <i className="bi bi-exclamation-circle" />
          Висок приоритет
        </FilterChip>
        <FilterChip
          active={filters.resolvedOnly}
          onClick={() => setFilters({ resolvedOnly: !filters.resolvedOnly, showInactive: false })}
        >
          <i className="bi bi-check-circle" />
          Решени
        </FilterChip>
        <FilterChip active={filters.nearMe} onClick={() => setFilters({ nearMe: !filters.nearMe })}>
          <i className="bi bi-geo" />
          Близо до мен
        </FilterChip>
        {isAdmin ? (
          <FilterChip active={!!adminQuickMode} onClick={() => onAdminQuickModeChange?.(!adminQuickMode)}>
            <i className="bi bi-shield-check" />
            Бърза модерация
          </FilterChip>
        ) : null}
      </div>
    </div>
  );
}
