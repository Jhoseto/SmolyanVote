"use client";

import { cn } from "@/shared/lib/cn";
import type { PodcastSortOption } from "../hooks/usePodcastFilters";

const SORT_LABELS: Record<PodcastSortOption, string> = {
  newest: "Най-нови",
  oldest: "Най-стари",
  popular: "Популярни",
  longest: "Най-дълги",
  shortest: "Най-кратки",
};

interface PodcastToolbarProps {
  search: string;
  sort: PodcastSortOption;
  resultCount: number;
  onSearchChange: (value: string) => void;
  onSortChange: (value: PodcastSortOption) => void;
}

export function PodcastToolbar({
  search,
  sort,
  resultCount,
  onSearchChange,
  onSortChange,
}: PodcastToolbarProps) {
  return (
    <section className="rounded-[24px] border border-black/[0.06] bg-white/80 p-4 shadow-[0_18px_50px_-36px_rgba(25,134,28,0.45)] backdrop-blur-xl sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative min-w-0 flex-1">
          <i className="bi bi-search pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--color-text-muted)]" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Търси епизод, тема или номер в реално време…"
            className="h-12 w-full rounded-[16px] border border-black/[0.08] bg-[#f8fbf8] pl-11 pr-4 text-[0.92rem] text-[color:var(--color-text-primary)] outline-none transition-all placeholder:text-[color:var(--color-text-muted)] focus:border-primary/35 focus:bg-white focus:shadow-[0_0_0_4px_rgba(25,134,28,0.12)]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(SORT_LABELS) as PodcastSortOption[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onSortChange(option)}
              className={cn(
                "rounded-full px-3.5 py-2 text-[0.78rem] font-medium tracking-wide transition-all",
                sort === option
                  ? "bg-[image:var(--gradient-primary)] text-white shadow-[0_10px_24px_-14px_rgba(25,134,28,0.75)]"
                  : "bg-[#eef5f0] text-[color:var(--color-text-secondary)] hover:bg-primary-50 hover:text-primary",
              )}
            >
              {SORT_LABELS[option]}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 text-[0.78rem] text-[color:var(--color-text-muted)]">
        {resultCount === 0
          ? "Няма намерени епизоди за текущите филтри."
          : `${resultCount} ${resultCount === 1 ? "епизод" : "епизода"} • филтриране в реално време`}
      </p>
    </section>
  );
}
