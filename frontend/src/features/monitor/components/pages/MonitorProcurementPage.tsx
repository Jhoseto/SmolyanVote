"use client";

import { useEffect, useState } from "react";
import { EmptyState, LogoLoader } from "@/shared/ui";
import { monitorApi } from "../../api";
import { MonitorCompetitionPanel } from "../MonitorCompetitionPanel";
import { MonitorFilteredFeedGrid } from "../MonitorFilteredFeedGrid";
import { MonitorMobileShell } from "../MonitorMobileShell";
import { MonitorProcurementCharts } from "../MonitorProcurementCharts";
import { useMonitorAuthority } from "../MonitorAuthorityProvider";
import { useMonitorOverview } from "../../hooks/useMonitorOverview";
import type { MonitorCompetition, MonitorFeedItem, MonitorProcurementStats } from "../../types";

const PAGE_SIZE = 24;

export function MonitorProcurementPage() {
  const { authority } = useMonitorAuthority();
  const { overview, loading: overviewLoading } = useMonitorOverview();
  const [stats, setStats] = useState<MonitorProcurementStats | null>(null);
  const [competition, setCompetition] = useState<MonitorCompetition | null>(null);
  const [items, setItems] = useState<MonitorFeedItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      monitorApi.procurementStats(authority),
      monitorApi.competition(authority),
      monitorApi.feed({ type: "contract", page, size: PAGE_SIZE, sort: "risk" }, authority),
    ])
      .then(([s, c, feed]) => {
        if (cancelled) return;
        setStats(s);
        setCompetition(c);
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

  return (
    <MonitorMobileShell overview={overview} overviewLoading={overviewLoading} title="Поръчки и договори">
      <MonitorProcurementCharts stats={stats} loading={loading} />
      <section className="mt-6">
        <MonitorCompetitionPanel data={competition} loading={loading} />
      </section>
      <section className="mt-6 space-y-3">
        <div>
          <h2 className="font-display text-[1rem] font-semibold">Анализ по договори</h2>
          <p className="text-[0.78rem] text-[color:var(--color-text-muted)]">
            {total.toLocaleString("bg-BG")} договора · подредени по риск за данъкоплатеца
          </p>
        </div>
        {loading ? (
          <LogoLoader label="Зареждане…" />
        ) : (
          <>
            <MonitorFilteredFeedGrid
              items={items}
              emptyIcon="bi-basket"
              emptyTitle="Няма договори"
              emptyDescription="Пуснете SIGMA import."
              controlOptions={{ itemType: false }}
              initialFilters={{ sort: "risk-desc" }}
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
    </MonitorMobileShell>
  );
}
