"use client";

import { cn } from "@/shared/lib/cn";
import {
  ACTIVITY_SORT_FIELD_LABELS,
  ACTIVITY_TIME_RANGE_LABELS,
  ACTIVITY_TYPE_CATEGORY_LABELS,
  DEFAULT_ACTIVITY_FEED_FILTERS,
  hasActiveActivityFilters,
  type ActivityFeedFilters,
  type ActivitySortField,
  type ActivityTimeRange,
} from "../lib/activityFeedFilters";

interface ActivityFeedToolbarProps {
  filters: ActivityFeedFilters;
  onChange: (next: ActivityFeedFilters) => void;
  options: {
    actions: string[];
    entityTypes: string[];
    usernames: string[];
    typeCategories: string[];
  };
  page: number;
  totalPages: number;
  totalMatching: number;
  pageSize: number;
  isFetching?: boolean;
  onPageChange: (page: number) => void;
}

const inputClass =
  "rounded border border-border-default/60 bg-[color:var(--color-surface)] px-2 py-1.5 text-xs text-[color:var(--color-text-primary)]";

export function ActivityFeedToolbar({
  filters,
  onChange,
  options,
  page,
  totalPages,
  totalMatching,
  pageSize,
  isFetching,
  onPageChange,
}: ActivityFeedToolbarProps) {
  const active = hasActiveActivityFilters(filters);
  const safeTotalPages = Math.max(1, totalPages);

  function patch(partial: Partial<ActivityFeedFilters>) {
    onChange({ ...filters, ...partial });
  }

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border-default/60 bg-[color:var(--color-surface-muted)]/30 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[min(100%,280px)] flex-1">
          <i
            className="bi bi-search pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[color:var(--color-text-muted)]"
            aria-hidden
          />
          <input
            value={filters.query}
            onChange={(e) => patch({ query: e.target.value })}
            placeholder="Търсене по думи, IP, потребител, детайли… (цялата база)"
            className={cn(inputClass, "w-full pl-8")}
            aria-label="Търсене в активностите"
          />
        </div>
        {active && (
          <button
            type="button"
            onClick={() => onChange({ ...DEFAULT_ACTIVITY_FEED_FILTERS })}
            className="rounded border border-border-default/60 px-2.5 py-1.5 text-xs text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface)]"
          >
            Изчисти филтрите
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <FilterPill
          active={!filters.typeCategory}
          onClick={() => patch({ typeCategory: "" })}
          label="Всички типове"
        />
        {options.typeCategories.map((cat) => (
          <FilterPill
            key={cat}
            active={filters.typeCategory === cat}
            onClick={() => patch({ typeCategory: filters.typeCategory === cat ? "" : cat })}
            label={ACTIVITY_TYPE_CATEGORY_LABELS[cat] ?? cat}
          />
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <FilterSelect
          label="Потребител"
          value={filters.username}
          onChange={(username) => patch({ username })}
          options={options.usernames}
          allLabel="Всички потребители"
        />
        <FilterSelect
          label="Действие"
          value={filters.action}
          onChange={(action) => patch({ action })}
          options={options.actions}
          allLabel="Всички действия"
        />
        <FilterSelect
          label="Тип обект"
          value={filters.entityType}
          onChange={(entityType) => patch({ entityType })}
          options={options.entityTypes}
          allLabel="Всички обекти"
        />
        <label className="flex flex-col gap-1 text-[10px] font-medium uppercase tracking-wide text-[color:var(--color-text-muted)]">
          Период
          <select
            value={filters.timeRange}
            onChange={(e) => patch({ timeRange: e.target.value as ActivityTimeRange })}
            className={inputClass}
          >
            {(Object.keys(ACTIVITY_TIME_RANGE_LABELS) as ActivityTimeRange[]).map((key) => (
              <option key={key} value={key}>
                {ACTIVITY_TIME_RANGE_LABELS[key]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[10px] font-medium uppercase tracking-wide text-[color:var(--color-text-muted)]">
          Сортиране
          <select
            value={filters.sortField}
            onChange={(e) => patch({ sortField: e.target.value as ActivitySortField })}
            className={inputClass}
          >
            {(Object.keys(ACTIVITY_SORT_FIELD_LABELS) as ActivitySortField[]).map((key) => (
              <option key={key} value={key}>
                {ACTIVITY_SORT_FIELD_LABELS[key]}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium uppercase tracking-wide text-[color:var(--color-text-muted)]">
            Ред
          </span>
          <div className="flex gap-1">
            <SortDirButton
              active={filters.sortDir === "desc"}
              label="↓ Низх."
              onClick={() => patch({ sortDir: "desc" })}
            />
            <SortDirButton
              active={filters.sortDir === "asc"}
              label="↑ Възх."
              onClick={() => patch({ sortDir: "asc" })}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[color:var(--color-text-muted)]">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={filters.ipOnly}
            onChange={(e) => patch({ ipOnly: e.target.checked })}
            className="rounded"
          />
          Само записи с IP адрес
        </label>
        <span>
          <strong className="text-[color:var(--color-text-primary)]">{totalMatching.toLocaleString("bg-BG")}</strong>{" "}
          резултата в базата
          {isFetching ? " · зареждане…" : ""}
          {active ? " · филтри/сортиране на сървъра" : ""}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] text-[color:var(--color-text-muted)]">
          Страница{" "}
          <strong className="text-[color:var(--color-text-primary)]">{page + 1}</strong> от{" "}
          <strong className="text-[color:var(--color-text-primary)]">{safeTotalPages}</strong>
          {" · "}
          {pageSize} на страница
        </span>
        <div className="flex gap-1">
          <PaginationButton
            disabled={page <= 0 || isFetching}
            onClick={() => onPageChange(page - 1)}
            label="← По-нови"
          />
          <PaginationButton
            disabled={page + 1 >= safeTotalPages || isFetching}
            onClick={() => onPageChange(page + 1)}
            label="По-стари →"
          />
        </div>
      </div>
    </div>
  );
}

function FilterPill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
        active
          ? "bg-primary text-white"
          : "border border-border-default/60 bg-[color:var(--color-surface)] text-[color:var(--color-text-secondary)] hover:border-primary/40",
      )}
    >
      {label}
    </button>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  allLabel: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-[10px] font-medium uppercase tracking-wide text-[color:var(--color-text-muted)]">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        <option value="">{allLabel}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

function SortDirButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded border px-2 py-1.5 text-xs",
        active
          ? "border-primary bg-primary/10 font-medium text-primary"
          : "border-border-default/60 text-[color:var(--color-text-secondary)]",
      )}
    >
      {label}
    </button>
  );
}

function PaginationButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded border border-border-default/60 px-3 py-1.5 text-xs font-medium text-[color:var(--color-text-secondary)] hover:border-primary/50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
    >
      {label}
    </button>
  );
}
