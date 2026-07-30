"use client";

import { cn } from "@/shared/lib/cn";
import { useActiveSignalsFilterCount } from "./SignalsFilters";

interface SignalsMobileTopBarProps {
  activeCount: number;
  filteredCount: number;
  onOpenFilters: () => void;
  onOpenInfo: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function SignalsMobileTopBar({
  activeCount,
  filteredCount,
  onOpenFilters,
  onOpenInfo,
  onRefresh,
  isRefreshing,
}: SignalsMobileTopBarProps) {
  const filterCount = useActiveSignalsFilterCount();

  return (
    <header className="signals-mobile-top shrink-0 border-b border-border-default/20 bg-white/95 px-3 backdrop-blur-md">
      <div className="flex h-[var(--signals-mobile-top)] items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="truncate font-display text-base font-bold tracking-[-0.02em] text-[color:var(--color-text-heading)]">
            Сигнали
          </h1>
          <p className="truncate text-[0.68rem] text-[color:var(--color-text-muted)]">
            {filteredCount} показани · {activeCount} активни
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Обнови"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border-default/40 bg-white text-[color:var(--color-text-secondary)] shadow-sm disabled:opacity-50"
          >
            <i className={cn("bi bi-arrow-clockwise", isRefreshing && "animate-spin")} />
          </button>
          <button
            type="button"
            onClick={onOpenFilters}
            aria-label="Филтри"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border-default/40 bg-white text-[color:var(--color-text-secondary)] shadow-sm"
          >
            <i className="bi bi-funnel" />
            {filterCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.6rem] font-bold text-white">
                {filterCount}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={onOpenInfo}
            aria-label="Информация"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border-default/40 bg-white text-primary shadow-sm"
          >
            <i className="bi bi-question-circle" />
          </button>
        </div>
      </div>
    </header>
  );
}

export type SignalsMobileTab = "map" | "list";

interface SignalsMobileTabBarProps {
  tab: SignalsMobileTab;
  onTabChange: (tab: SignalsMobileTab) => void;
}

export function SignalsMobileTabBar({ tab, onTabChange }: SignalsMobileTabBarProps) {
  const items: { id: SignalsMobileTab; label: string; icon: string }[] = [
    { id: "map", label: "Карта", icon: "bi-map" },
    { id: "list", label: "Списък", icon: "bi-list-ul" },
  ];

  return (
    <nav
      className="signals-mobile-tabs shrink-0 border-b border-border-default/15 bg-white/95 px-2 backdrop-blur-md"
      aria-label="Изглед на сигналите"
    >
      <div className="flex h-[var(--signals-mobile-tabs)] gap-1 p-1">
        {items.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-colors",
                active
                  ? "bg-[image:var(--gradient-primary)] text-white shadow-[0_4px_12px_rgba(25,134,28,0.28)]"
                  : "text-[color:var(--color-text-secondary)] hover:bg-primary-50/60 hover:text-primary",
              )}
            >
              <i className={cn("bi", item.icon)} />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
