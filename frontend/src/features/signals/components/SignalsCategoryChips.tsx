"use client";

import { useMemo } from "react";
import { cn } from "@/shared/lib/cn";
import { SIGNAL_CATEGORIES, categoryIcon } from "../data/categories";
import { useSignalsFilters } from "../hooks/useSignalsFilters";
import type { Signal, SignalCategory } from "../types";

interface SignalsCategoryChipsProps {
  dataset: Signal[] | undefined;
  className?: string;
}

export function SignalsCategoryChips({ dataset, className }: SignalsCategoryChipsProps) {
  const [filters, setFilters] = useSignalsFilters();

  const counts = useMemo(() => {
    const map = new Map<SignalCategory, number>();
    for (const s of dataset ?? []) {
      if (!s.isActive || s.isResolved) continue;
      map.set(s.category, (map.get(s.category) ?? 0) + 1);
    }
    return map;
  }, [dataset]);

  const topCategories = useMemo(
    () =>
      SIGNAL_CATEGORIES.filter((c) => (counts.get(c.value) ?? 0) > 0)
        .sort((a, b) => (counts.get(b.value) ?? 0) - (counts.get(a.value) ?? 0))
        .slice(0, 8),
    [counts],
  );

  if (topCategories.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <button
        type="button"
        onClick={() => setFilters({ category: null })}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-pill)] px-3 text-xs font-semibold transition-all",
          !filters.category
            ? "bg-[image:var(--gradient-primary)] text-white shadow-[0_4px_12px_rgba(13,110,253,0.28)]"
            : "border border-border-default/40 bg-white text-[color:var(--color-text-secondary)] hover:border-primary/25",
        )}
      >
        <i className="bi bi-grid" />
        Всички
      </button>
      {topCategories.map((cat) => {
        const active = filters.category === cat.value;
        const count = counts.get(cat.value) ?? 0;
        return (
          <button
            key={cat.value}
            type="button"
            onClick={() => setFilters({ category: active ? null : cat.value })}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-pill)] px-3 text-xs font-semibold transition-all",
              active
                ? "bg-[image:var(--gradient-primary)] text-white shadow-[0_4px_12px_rgba(13,110,253,0.28)]"
                : "border border-border-default/40 bg-white text-[color:var(--color-text-secondary)] hover:border-primary/25",
            )}
          >
            <i className={cn("bi", categoryIcon(cat.value))} />
            {cat.label}
            <span className={cn("rounded-full px-1.5 py-0.5 text-[10px]", active ? "bg-white/20" : "bg-[color:var(--color-surface-muted)]")}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
