"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/shared/ui";
import { useIsMobile } from "@/shared/hooks/useMediaQuery";
import { monitorApi } from "../../api";
import { MonitorBriefingPanel } from "../MonitorBriefingPanel";
import { MonitorDetailSheet } from "../MonitorDetailSheet";
import { MonitorFilteredFeedGrid } from "../MonitorFilteredFeedGrid";
import { MonitorListControls } from "../MonitorListControls";
import { MonitorMobileShell } from "../MonitorMobileShell";
import { MonitorSearchBar } from "../MonitorSearchBar";
import { useMonitorListFilters } from "../../hooks/useMonitorListFilters";
import { useMonitorOverview } from "../../hooks/useMonitorOverview";
import { useMonitorAuthority } from "../MonitorAuthorityProvider";
import type { MonitorFeedItem } from "../../types";

const PAGE_SIZE = 24;

export function MonitorHomePage() {
  const { authority, withAuthority } = useMonitorAuthority();
  const { overview, loading: overviewLoading } = useMonitorOverview();
  const isMobile = useIsMobile();
  const [briefing, setBriefing] = useState<Awaited<ReturnType<typeof monitorApi.briefing>> | null>(null);
  const [items, setItems] = useState<MonitorFeedItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sheetItem, setSheetItem] = useState<MonitorFeedItem | null>(null);

  const { filters, patch, reset, filtered, categories, riskFlags, totalCount } = useMonitorListFilters(items, {
    sort: "risk-desc",
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      monitorApi.briefing(authority),
      monitorApi.feed({ type: "contract", page, size: PAGE_SIZE, sort: "risk" }, authority),
    ])
      .then(([b, feed]) => {
        if (cancelled) return;
        setBriefing(b);
        setItems(feed.items);
        setTotal(feed.totalElements);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authority, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const isInitialLoad = loading && briefing === null;

  return (
    <MonitorMobileShell overview={overview} overviewLoading={overviewLoading} contentLoading={isInitialLoad}>
      <MonitorSearchBar className="max-w-xl" />
      <MonitorBriefingPanel briefing={briefing} loading={false} />

      <section className="relative mt-8 space-y-4">
        {loading && !isInitialLoad && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center rounded-[var(--radius-lg)] bg-white/75 backdrop-blur-[1px]"
            aria-busy="true"
          >
            <span className="text-[0.85rem] font-medium text-[color:var(--color-text-muted)]">Зареждане…</span>
          </div>
        )}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-[1.1rem] font-semibold text-[color:var(--color-text-heading)]">
              Поръчки с анализ
            </h2>
            <p className="text-[0.8rem] text-[color:var(--color-text-muted)]">
              {total.toLocaleString("bg-BG")} договора в базата · сортирани по риск, не по сух регистър
            </p>
          </div>
          <Link
            href={withAuthority("/monitor/anomalies")}
            className="text-[0.8rem] font-medium text-primary hover:underline"
          >
            Само аномалиите →
          </Link>
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon="bi-inbox"
            title="Няма данни"
            description="Пуснете SIGMA import от админ панела."
          />
        ) : (
          <>
            <MonitorListControls
              filters={filters}
              onChange={patch}
              onReset={reset}
              categories={categories}
              riskFlags={riskFlags}
              totalCount={totalCount}
              filteredCount={filtered.length}
              options={{ itemType: false }}
            />
            <MonitorFilteredFeedGrid
              items={filtered}
              hideControlsWhenEmpty={false}
              gridClassName="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
              onPreview={isMobile ? (item) => setSheetItem(item) : undefined}
            />
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={page <= 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="rounded-full border border-border-default px-4 py-2 text-[0.8rem] disabled:opacity-40"
                >
                  ← По-стари
                </button>
                <span className="text-[0.78rem] text-[color:var(--color-text-muted)]">
                  {page + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-full border border-border-default px-4 py-2 text-[0.8rem] disabled:opacity-40"
                >
                  Още →
                </button>
              </div>
            )}
          </>
        )}
      </section>
      <MonitorDetailSheet item={sheetItem} onClose={() => setSheetItem(null)} />
    </MonitorMobileShell>
  );
}
