"use client";

import { EmptyState } from "@/shared/ui";
import type { MonitorFeedItem } from "../types";
import { MonitorInsightCard } from "./MonitorInsightCard";
import { MonitorListControls, type MonitorListControlsOptions } from "./MonitorListControls";
import { useMonitorListFilters } from "../hooks/useMonitorListFilters";
import type { MonitorListFilters } from "../lib/listFilters";

interface MonitorFilteredFeedGridProps {
  items: MonitorFeedItem[];
  emptyIcon?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  showFlags?: boolean;
  onPreview?: (item: MonitorFeedItem) => void;
  controlOptions?: MonitorListControlsOptions;
  initialFilters?: Partial<MonitorListFilters>;
  hideControlsWhenEmpty?: boolean;
  gridClassName?: string;
}

export function MonitorFilteredFeedGrid({
  items,
  emptyIcon = "bi-inbox",
  emptyTitle = "Няма записи",
  emptyDescription,
  showFlags,
  onPreview,
  controlOptions,
  initialFilters,
  hideControlsWhenEmpty = true,
  gridClassName = "grid gap-3 md:grid-cols-2",
}: MonitorFilteredFeedGridProps) {
  const { filters, patch, reset, filtered, categories, riskFlags, totalCount } =
    useMonitorListFilters(items, initialFilters);

  if (items.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="space-y-4">
      {!(hideControlsWhenEmpty && items.length === 0) && (
        <MonitorListControls
          filters={filters}
          onChange={patch}
          onReset={reset}
          categories={categories}
          riskFlags={riskFlags}
          totalCount={totalCount}
          filteredCount={filtered.length}
          options={controlOptions}
        />
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon="bi-funnel"
          title="Няма съвпадения"
          description="Опитайте да промените или изчистите филтрите."
        />
      ) : (
        <div className={gridClassName}>
          {filtered.map((item) => (
            <MonitorInsightCard
              key={`${item.itemType}-${item.id}`}
              item={item}
              showFlags={showFlags}
              onPreview={onPreview ? () => onPreview(item) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
