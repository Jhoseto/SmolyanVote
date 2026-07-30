"use client";

import { cn } from "@/shared/lib/cn";
import { useToast } from "@/shared/hooks/useToast";
import { useSignalsFilters } from "../hooks/useSignalsFilters";
import { useActiveSignalsFilterCount } from "./SignalsFilters";

const SORT_LABELS: Record<string, string> = {
  newest: "Най-нови",
  oldest: "Най-стари",
  popular: "Приоритет",
  viewed: "Разглеждани",
};

interface SignalsMobileActionBarProps {
  onOpenFilters: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  className?: string;
}

export function SignalsMobileActionBar({
  onOpenFilters,
  onRefresh,
  isRefreshing,
  className,
}: SignalsMobileActionBarProps) {
  const [filters, setFilters] = useSignalsFilters();
  const filterCount = useActiveSignalsFilterCount();
  const toast = useToast();

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

  async function handleShareFilters() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Линкът с филтрите е копиран.");
    } catch {
      toast.error("Не успяхме да копираме линка.");
    }
  }

  return (
    <div className={cn("flex shrink-0 items-center gap-2 border-b border-border-default/10 bg-white/95 px-3 py-2", className)}>
      <button
        type="button"
        onClick={onOpenFilters}
        className="relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[var(--radius-md)] border border-border-default/35 bg-white px-2.5 text-xs font-semibold text-[color:var(--color-text-secondary)]"
      >
        <i className="bi bi-funnel" />
        Филтри
        {filterCount > 0 ? (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.6rem] font-bold text-white">
            {filterCount}
          </span>
        ) : null}
      </button>

      <select
        value={filters.sort}
        onChange={(e) => setFilters({ sort: e.target.value as never })}
        className="h-9 min-w-0 flex-1 rounded-[var(--radius-md)] border border-border-default/35 bg-white px-2 text-xs font-semibold text-[color:var(--color-text-secondary)] outline-none focus:border-primary"
        aria-label="Подредба"
      >
        {Object.entries(SORT_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        aria-label="Обнови"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-border-default/35 bg-white text-[color:var(--color-text-secondary)] disabled:opacity-50"
      >
        <i className={cn("bi bi-arrow-clockwise", isRefreshing && "animate-spin")} />
      </button>

      {hasActiveFilters ? (
        <button
          type="button"
          onClick={handleShareFilters}
          aria-label="Сподели филтрите"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-border-default/35 bg-white text-[color:var(--color-text-secondary)]"
        >
          <i className="bi bi-link-45deg" />
        </button>
      ) : null}
    </div>
  );
}
