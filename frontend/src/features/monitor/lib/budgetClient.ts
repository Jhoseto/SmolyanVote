import type { MonitorBudget, MonitorOfficialBudget } from "../types";
import type { MonitorBudgetYearFilterValue } from "../components/MonitorBudgetYearFilter";
import { buildBudgetYearOptions } from "../components/MonitorBudgetYearFilter";

export type MonitorAuthorityKey = string | null | undefined;

function authorityKey(authority: MonitorAuthorityKey): string {
  return authority ?? "__oblast__";
}

/** Cache key for a single calendar year. */
export function singleYearCacheKey(authority: MonitorAuthorityKey, year: number): string {
  return `${authorityKey(authority)}:y:${year}`;
}

/** Cache key for a range request (fallback when merge impossible). */
export function rangeCacheKey(authority: MonitorAuthorityKey, from: number, to: number): string {
  return `${authorityKey(authority)}:r:${from}-${to}`;
}

export function yearsInFilter(filter: MonitorBudgetYearFilterValue): number[] {
  if (filter.mode === "single") {
    return [filter.singleYear];
  }
  const from = Math.min(filter.yearFrom, filter.yearTo);
  const to = Math.max(filter.yearFrom, filter.yearTo);
  const years: number[] = [];
  for (let y = from; y <= to; y++) years.push(y);
  return years;
}

export function resolveYearFilter(filter: MonitorBudgetYearFilterValue): {
  from: number;
  to: number;
  isRange: boolean;
} {
  if (filter.mode === "single") {
    return { from: filter.singleYear, to: filter.singleYear, isRange: false };
  }
  return {
    from: Math.min(filter.yearFrom, filter.yearTo),
    to: Math.max(filter.yearFrom, filter.yearTo),
    isRange: filter.yearFrom !== filter.yearTo,
  };
}

function num(v: number | string | null | undefined): number {
  if (v == null) return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Merge single-year budget snapshots client-side (no extra API call). */
export function mergeBudgetYears(snapshots: MonitorBudget[], from: number, to: number): MonitorBudget {
  if (snapshots.length === 0) {
    throw new Error("mergeBudgetYears: empty snapshots");
  }
  const base = snapshots[0];
  const rowMap = new Map<
    string,
    { id: string; label: string; plannedEur: number; executedEur: number }
  >();

  for (const snap of snapshots) {
    for (const row of snap.rows) {
      const prev = rowMap.get(row.id);
      if (prev) {
        prev.plannedEur += num(row.plannedEur);
        prev.executedEur += num(row.executedEur);
      } else {
        rowMap.set(row.id, {
          id: row.id,
          label: row.label,
          plannedEur: num(row.plannedEur),
          executedEur: num(row.executedEur),
        });
      }
    }
  }

  const rows = Array.from(rowMap.values()).map((r) => ({
    ...r,
    executionPercent:
      r.plannedEur > 0 ? Math.round((r.executedEur / r.plannedEur) * 1000) / 10 : 0,
  }));

  const totalPlanned = rows.reduce((s, r) => s + r.plannedEur, 0);
  const totalExecuted = rows.reduce((s, r) => s + r.executedEur, 0);
  const contractCount = snapshots.reduce((s, snap) => s + (snap.contractCount ?? 0), 0);
  const isRange = from !== to;
  const currentYear = new Date().getFullYear();
  const showPlan = !isRange && from === currentYear && snapshots.every((s) => s.plannedAvailable);

  const periodLabel = isRange ? `${from}–${to} г.` : `${from} г.`;

  return {
    ...base,
    year: from,
    yearTo: to,
    availableYears: base.availableYears ?? buildBudgetYearOptions([]),
    totalPlannedEur: showPlan ? totalPlanned : 0,
    totalExecutedEur: totalExecuted,
    rows: showPlan
      ? rows
      : rows.map((r) => ({ ...r, plannedEur: 0, executionPercent: 0 })),
    plannedAvailable: showPlan,
    contractCount,
    officialBudget: isRange ? null : (snapshots.find((s) => s.year === from)?.officialBudget ?? null),
    note: isRange
      ? `${contractCount} договора за периода ${periodLabel} (${formatMillions(totalExecuted)}). Сумирано на клиента от кеширани години.`
      : base.note,
  };
}

function formatMillions(eur: number): string {
  if (eur >= 1_000_000) return `${(eur / 1_000_000).toFixed(1)} млн €`;
  return `${Math.round(eur).toLocaleString("bg-BG")} €`;
}

export class MonitorBudgetCache {
  private readonly store = new Map<string, MonitorBudget>();
  private readonly officialByYear = new Map<string, MonitorOfficialBudget>();

  get(key: string): MonitorBudget | undefined {
    return this.store.get(key);
  }

  set(key: string, value: MonitorBudget): void {
    this.store.set(key, value);
    if (value.officialBudget) {
      this.officialByYear.set(key, value.officialBudget);
    }
  }

  officialForYear(authority: MonitorAuthorityKey, year: number): MonitorOfficialBudget | null {
    return this.officialByYear.get(singleYearCacheKey(authority, year)) ?? null;
  }

  clearAuthority(authority: MonitorAuthorityKey): void {
    const prefix = `${authorityKey(authority)}:`;
    for (const key of [...this.store.keys()]) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
    for (const key of [...this.officialByYear.keys()]) {
      if (key.startsWith(prefix)) this.officialByYear.delete(key);
    }
  }

  /** Years worth prefetching after first load (recent years only). */
  prefetchCandidates(primaryYear: number): number[] {
    const current = new Date().getFullYear();
    return [primaryYear, current, current - 1, current - 2, current - 3].filter(
      (y, i, arr) => y >= 2010 && y <= current + 1 && arr.indexOf(y) === i,
    );
  }
}
