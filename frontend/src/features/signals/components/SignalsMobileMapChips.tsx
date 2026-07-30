"use client";

import { useMemo } from "react";
import { cn } from "@/shared/lib/cn";
import { useSignalsFilters } from "../hooks/useSignalsFilters";
import { SIGNAL_CATEGORIES, categoryIcon } from "../data/categories";
import type { Signal, SignalCategory } from "../types";

interface SignalsMobileMapChipsProps {
  dataset: Signal[] | undefined;
}

export function SignalsMobileMapChips({ dataset }: SignalsMobileMapChipsProps) {
  const [filters, setFilters] = useSignalsFilters();

  const topCategories = useMemo(() => {
    const counts = new Map<SignalCategory, number>();
    for (const s of dataset ?? []) {
      if (!s.isActive || s.isResolved) continue;
      counts.set(s.category, (counts.get(s.category) ?? 0) + 1);
    }
    return SIGNAL_CATEGORIES.filter((c) => (counts.get(c.value) ?? 0) > 0)
      .sort((a, b) => (counts.get(b.value) ?? 0) - (counts.get(a.value) ?? 0))
      .slice(0, 5);
  }, [dataset]);

  if (topCategories.length === 0) return null;

  return (
    <div className="signals-mobile-map-chips pointer-events-auto">
      <button
        type="button"
        onClick={() => setFilters({ category: null })}
        className={cn(
          "inline-flex shrink-0 items-center gap-1 rounded-[var(--radius-pill)] px-2.5 py-1.5 text-[0.68rem] font-semibold shadow-sm backdrop-blur-md",
          !filters.category
            ? "bg-[image:var(--gradient-primary)] text-white"
            : "border border-white/60 bg-white/90 text-[color:var(--color-text-secondary)]",
        )}
      >
        <i className="bi bi-grid" />
        Всички
      </button>
      {topCategories.map((cat) => {
        const active = filters.category === cat.value;
        return (
          <button
            key={cat.value}
            type="button"
            onClick={() => setFilters({ category: active ? null : cat.value })}
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-[var(--radius-pill)] px-2.5 py-1.5 text-[0.68rem] font-semibold shadow-sm backdrop-blur-md",
              active
                ? "bg-[image:var(--gradient-primary)] text-white"
                : "border border-white/60 bg-white/90 text-[color:var(--color-text-secondary)]",
            )}
          >
            <i className={cn("bi", categoryIcon(cat.value))} />
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
