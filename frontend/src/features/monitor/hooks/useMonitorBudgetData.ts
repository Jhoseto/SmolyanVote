"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { monitorApi, type MonitorAuthority } from "../api";
import type { MonitorBudgetYearFilterValue } from "../components/MonitorBudgetYearFilter";
import { buildBudgetYearOptions } from "../components/MonitorBudgetYearFilter";
import {
  MonitorBudgetCache,
  mergeBudgetYears,
  rangeCacheKey,
  resolveYearFilter,
  singleYearCacheKey,
} from "../lib/budgetClient";
import type { MonitorBudget } from "../types";

const globalCache = new MonitorBudgetCache();

async function fetchSingleYear(authority: MonitorAuthority, year: number): Promise<MonitorBudget> {
  return monitorApi.budget(authority, { year });
}

export function useMonitorBudgetData(authority: MonitorAuthority) {
  const [yearFilter, setYearFilter] = useState<MonitorBudgetYearFilterValue>(() => {
    const y = new Date().getFullYear();
    return { mode: "single", singleYear: y, yearFrom: y, yearTo: y };
  });
  const [budget, setBudget] = useState<MonitorBudget | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const prefetching = useRef(false);
  const authorityRef = useRef(authority);
  authorityRef.current = authority;

  const yearOptions = useMemo(
    () => buildBudgetYearOptions(budget?.availableYears ?? []),
    [budget?.availableYears],
  );

  const prefetchYears = useCallback(async (primaryYear: number) => {
    if (prefetching.current) return;
    prefetching.current = true;
    const auth = authorityRef.current;
    const candidates = globalCache.prefetchCandidates(primaryYear);
    await Promise.all(
      candidates.map(async (y) => {
        const key = singleYearCacheKey(auth, y);
        if (globalCache.get(key)) return;
        try {
          const snap = await fetchSingleYear(auth, y);
          globalCache.set(key, snap);
        } catch {
          /* background prefetch — ignore */
        }
      }),
    );
    prefetching.current = false;
  }, []);

  const loadBudget = useCallback(async (filter: MonitorBudgetYearFilterValue) => {
    const auth = authorityRef.current;
    const { from, to, isRange } = resolveYearFilter(filter);

    if (!isRange) {
      const cached = globalCache.get(singleYearCacheKey(auth, from));
      if (cached) {
        setBudget(cached);
        setLoading(false);
        setError(null);
        return;
      }
    } else {
      const rangeKey = rangeCacheKey(auth, from, to);
      const cachedRange = globalCache.get(rangeKey);
      if (cachedRange) {
        setBudget(cachedRange);
        setLoading(false);
        setError(null);
        return;
      }
      const parts: MonitorBudget[] = [];
      let allInCache = true;
      for (let y = from; y <= to; y++) {
        const part = globalCache.get(singleYearCacheKey(auth, y));
        if (!part) {
          allInCache = false;
          break;
        }
        parts.push(part);
      }
      if (allInCache && parts.length > 0) {
        const merged = mergeBudgetYears(parts, from, to);
        globalCache.set(rangeKey, merged);
        setBudget(merged);
        setLoading(false);
        setError(null);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      let data: MonitorBudget;

      if (!isRange) {
        data = await fetchSingleYear(auth, from);
        globalCache.set(singleYearCacheKey(auth, from), data);
      } else {
        const rangeKey = rangeCacheKey(auth, from, to);
        const parts = await Promise.all(
          Array.from({ length: to - from + 1 }, async (_, i) => {
            const y = from + i;
            const key = singleYearCacheKey(auth, y);
            const cached = globalCache.get(key);
            if (cached) return cached;
            const snap = await fetchSingleYear(auth, y);
            globalCache.set(key, snap);
            return snap;
          }),
        );
        data = mergeBudgetYears(parts, from, to);
        globalCache.set(rangeKey, data);
      }

      setBudget(data);
      setError(null);
      void prefetchYears(data.year);
    } catch (err: unknown) {
      setBudget(null);
      setError(err instanceof Error ? err.message : "Неуспешно зареждане на бюджета");
    } finally {
      setLoading(false);
    }
  }, [prefetchYears]);

  useEffect(() => {
    globalCache.clearAuthority(authority);
    prefetching.current = false;
    const y = new Date().getFullYear();
    setYearFilter({ mode: "single", singleYear: y, yearFrom: y, yearTo: y });
  }, [authority]);

  useEffect(() => {
    void loadBudget(yearFilter);
  }, [yearFilter, loadBudget]);

  const officialBudget = useMemo(() => {
    if (budget?.officialBudget) return budget.officialBudget;
    const { from, to } = resolveYearFilter(yearFilter);
    if (from !== to) return null;
    return globalCache.officialForYear(authority, from);
  }, [budget, yearFilter, authority]);

  return {
    budget,
    officialBudget,
    loading,
    error,
    yearFilter,
    setYearFilter,
    yearOptions,
  };
}
