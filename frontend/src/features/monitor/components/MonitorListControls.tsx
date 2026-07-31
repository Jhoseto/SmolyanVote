"use client";

import { cn } from "@/shared/lib/cn";
import {
  MONITOR_AMOUNT_THRESHOLDS,
  MONITOR_DATE_RANGE_LABELS,
  MONITOR_RISK_THRESHOLDS,
  MONITOR_SORT_LABELS,
  type MonitorListFilters,
} from "../lib/listFilters";

const selectClass =
  "h-9 rounded-full border border-border-default/40 bg-white/95 px-3 text-[0.78rem] font-medium shadow-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15";

export interface MonitorListControlsOptions {
  /** Show contract / document type filter */
  itemType?: boolean;
  /** Show category dropdown when categories exist */
  category?: boolean;
  /** Show risk threshold + specific flag */
  risk?: boolean;
  /** Show minimum amount threshold */
  amount?: boolean;
  /** Show date range filter */
  dateRange?: boolean;
}

interface MonitorListControlsProps {
  filters: MonitorListFilters;
  onChange: (patch: Partial<MonitorListFilters>) => void;
  onReset: () => void;
  categories?: string[];
  riskFlags?: { code: string; label: string }[];
  totalCount: number;
  filteredCount: number;
  options?: MonitorListControlsOptions;
  className?: string;
}

export function MonitorListControls({
  filters,
  onChange,
  onReset,
  categories = [],
  riskFlags = [],
  totalCount,
  filteredCount,
  options = {},
  className,
}: MonitorListControlsProps) {
  const {
    itemType = true,
    category = true,
    risk = true,
    amount = true,
    dateRange = true,
  } = options;

  const active =
    filters.search.trim() ||
    filters.sort !== "newest" ||
    filters.itemType ||
    filters.category ||
    filters.minRisk > 0 ||
    filters.minAmount > 0 ||
    filters.riskFlag ||
    filters.dateRange;

  return (
    <div className={cn("space-y-3 rounded-[var(--radius-lg)] border border-border-default/30 bg-white/90 p-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[12rem] flex-1">
          <i className="bi bi-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[0.75rem] text-[color:var(--color-text-muted)]" />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="Търси в списъка…"
            className="h-9 w-full rounded-full border border-border-default/40 bg-white/95 py-0 pl-8 pr-3 text-[0.82rem] outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
          />
        </div>

        <select
          value={filters.sort}
          onChange={(e) => onChange({ sort: e.target.value as MonitorListFilters["sort"] })}
          className={selectClass}
          aria-label="Сортиране"
        >
          {Object.entries(MONITOR_SORT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        {active && (
          <button
            type="button"
            onClick={onReset}
            className="rounded-full px-3 py-1.5 text-[0.76rem] font-medium text-primary transition hover:bg-primary-50"
          >
            Изчисти
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {itemType && (
          <TypeChip
            active={filters.itemType === ""}
            onClick={() => onChange({ itemType: "" })}
            label="Всички"
          />
        )}
        {itemType && (
          <TypeChip
            active={filters.itemType === "contract"}
            onClick={() => onChange({ itemType: "contract" })}
            label="Договори"
          />
        )}
        {itemType && (
          <TypeChip
            active={filters.itemType === "document"}
            onClick={() => onChange({ itemType: "document" })}
            label="Документи"
          />
        )}

        {category && categories.length > 0 && (
          <select
            value={filters.category}
            onChange={(e) => onChange({ category: e.target.value })}
            className={selectClass}
            aria-label="Категория"
          >
            <option value="">Всички категории</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}

        {dateRange && (
          <select
            value={filters.dateRange}
            onChange={(e) => onChange({ dateRange: e.target.value as MonitorListFilters["dateRange"] })}
            className={selectClass}
            aria-label="Период"
          >
            {Object.entries(MONITOR_DATE_RANGE_LABELS).map(([value, label]) => (
              <option key={value || "all"} value={value}>
                {label}
              </option>
            ))}
          </select>
        )}

        {amount && (
          <select
            value={filters.minAmount}
            onChange={(e) => onChange({ minAmount: Number(e.target.value) })}
            className={selectClass}
            aria-label="Минимална сума"
          >
            {MONITOR_AMOUNT_THRESHOLDS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        )}

        {risk && (
          <select
            value={filters.minRisk}
            onChange={(e) => onChange({ minRisk: Number(e.target.value) })}
            className={selectClass}
            aria-label="Минимален риск"
          >
            {MONITOR_RISK_THRESHOLDS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        )}

        {risk && riskFlags.length > 0 && (
          <select
            value={filters.riskFlag}
            onChange={(e) => onChange({ riskFlag: e.target.value })}
            className={selectClass}
            aria-label="Рисков флаг"
          >
            <option value="">Всички флагове</option>
            {riskFlags.map((f) => (
              <option key={f.code} value={f.code}>
                {f.label}
              </option>
            ))}
          </select>
        )}
      </div>

      <p className="text-[0.72rem] text-[color:var(--color-text-muted)]">
        {filteredCount === totalCount
          ? `${totalCount} записа`
          : `${filteredCount} от ${totalCount} записа`}
        {active ? " · филтриране в реално време" : ""}
      </p>
    </div>
  );
}

function TypeChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-[0.76rem] font-semibold transition",
        active
          ? "bg-primary text-white shadow-sm"
          : "border border-border-default/40 bg-white text-[color:var(--color-text-secondary)] hover:bg-primary-50/50",
      )}
    >
      {label}
    </button>
  );
}
