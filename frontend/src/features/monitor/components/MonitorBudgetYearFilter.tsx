"use client";

import { cn } from "@/shared/lib/cn";
import { MonitorSegmentButton } from "./MonitorSegmentButton";
import "./monitor-ui.css";

const selectClass =
  "h-9 min-w-[5.5rem] rounded-full border border-border-default/40 bg-white/95 px-3 text-[0.78rem] font-medium shadow-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15";

export type MonitorBudgetYearMode = "single" | "range";

export interface MonitorBudgetYearFilterValue {
  mode: MonitorBudgetYearMode;
  singleYear: number;
  yearFrom: number;
  yearTo: number;
}

interface MonitorBudgetYearFilterProps {
  years: number[];
  value: MonitorBudgetYearFilterValue;
  onChange: (value: MonitorBudgetYearFilterValue) => void;
  className?: string;
}

export function buildBudgetYearOptions(apiYears: number[] = []): number[] {
  const current = new Date().getFullYear();
  const start = Math.max(current - 12, 2010);
  const set = new Set<number>();
  for (let y = current; y >= start; y--) set.add(y);
  for (const y of apiYears) {
    if (y >= 2010 && y <= current + 1) set.add(y);
  }
  return Array.from(set).sort((a, b) => b - a);
}

export function MonitorBudgetYearFilter({
  years,
  value,
  onChange,
  className,
}: MonitorBudgetYearFilterProps) {
  const options = buildBudgetYearOptions(years);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-2xl border border-border-default/30 bg-white/90 p-3 shadow-[0_4px_20px_rgba(15,23,42,0.05)]",
        className,
      )}
    >
      <span className="text-[0.72rem] font-semibold uppercase tracking-wide text-[color:var(--color-text-muted)]">
        Период
      </span>

      <div className="flex rounded-full border border-border-default/35 bg-[color:var(--color-surface-muted)] p-0.5">
        <MonitorSegmentButton
          active={value.mode === "single"}
          onClick={() =>
            onChange({ ...value, mode: "single", yearFrom: value.singleYear, yearTo: value.singleYear })
          }
          className="rounded-full px-3 py-1.5 text-[0.75rem] font-semibold"
        >
          Една година
        </MonitorSegmentButton>
        <MonitorSegmentButton
          active={value.mode === "range"}
          onClick={() => onChange({ ...value, mode: "range" })}
          className="rounded-full px-3 py-1.5 text-[0.75rem] font-semibold"
        >
          От–до
        </MonitorSegmentButton>
      </div>

      {value.mode === "single" ? (
        <label className="flex items-center gap-2 text-[0.8rem] text-[color:var(--color-text-secondary)]">
          <span>Година</span>
          <select
            className={selectClass}
            value={value.singleYear}
            onChange={(e) => {
              const y = Number(e.target.value);
              onChange({ ...value, singleYear: y, yearFrom: y, yearTo: y });
            }}
          >
            {options.map((y) => (
              <option key={y} value={y}>
                {y} г.
              </option>
            ))}
          </select>
        </label>
      ) : (
        <>
          <label className="flex items-center gap-2 text-[0.8rem] text-[color:var(--color-text-secondary)]">
            <span>От</span>
            <select
              className={selectClass}
              value={value.yearFrom}
              onChange={(e) => {
                const y = Number(e.target.value);
                onChange({
                  ...value,
                  yearFrom: y,
                  yearTo: y > value.yearTo ? y : value.yearTo,
                });
              }}
            >
              {options.map((y) => (
                <option key={`from-${y}`} value={y}>
                  {y} г.
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-[0.8rem] text-[color:var(--color-text-secondary)]">
            <span>До</span>
            <select
              className={selectClass}
              value={value.yearTo}
              onChange={(e) => {
                const y = Number(e.target.value);
                onChange({
                  ...value,
                  yearTo: y,
                  yearFrom: y < value.yearFrom ? y : value.yearFrom,
                });
              }}
            >
              {options.map((y) => (
                <option key={`to-${y}`} value={y}>
                  {y} г.
                </option>
              ))}
            </select>
          </label>
        </>
      )}
    </div>
  );
}

export function formatBudgetPeriod(year: number, yearTo?: number): string {
  const to = yearTo ?? year;
  return year === to ? `${year} г.` : `${year}–${to} г.`;
}

export function budgetYearQuery(value: MonitorBudgetYearFilterValue): {
  year?: number;
  yearFrom?: number;
  yearTo?: number;
} {
  if (value.mode === "single") {
    return { year: value.singleYear };
  }
  return { yearFrom: value.yearFrom, yearTo: value.yearTo };
}
