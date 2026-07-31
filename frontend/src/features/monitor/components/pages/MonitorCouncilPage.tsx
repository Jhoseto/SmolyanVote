"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/shared/ui";
import { monitorApi } from "../../api";
import { MonitorCouncilStatsCards } from "../MonitorCouncilStatsCards";
import { MonitorCouncilTimeline } from "../MonitorCouncilTimeline";
import { MonitorCouncilorCards } from "../MonitorCouncilorCards";
import { MonitorListControls } from "../MonitorListControls";
import { MonitorMobileShell } from "../MonitorMobileShell";
import { useMonitorAuthority } from "../MonitorAuthorityProvider";
import { useMonitorOverview } from "../../hooks/useMonitorOverview";
import { useMonitorListFilters } from "../../hooks/useMonitorListFilters";
import type { MonitorCouncilStats, MonitorCouncilorCard, MonitorFeedItem } from "../../types";

export function MonitorCouncilPage() {
  const { authority, hasScrapedDocuments, label } = useMonitorAuthority();
  const { overview, loading: overviewLoading } = useMonitorOverview();
  const [items, setItems] = useState<MonitorFeedItem[]>([]);
  const [stats, setStats] = useState<MonitorCouncilStats | null>(null);
  const [councilors, setCouncilors] = useState<MonitorCouncilorCard[]>([]);
  const [loading, setLoading] = useState(true);

  const { filters, patch, reset, filtered, categories, totalCount } = useMonitorListFilters(items, {
    sort: "newest",
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      monitorApi.councilTimeline(authority),
      monitorApi.councilStats(authority),
      monitorApi.councilors(authority),
    ])
      .then(([timeline, councilStats, councilorCards]) => {
        if (cancelled) return;
        setItems(timeline);
        setStats(councilStats);
        setCouncilors(councilorCards);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authority]);

  return (
    <MonitorMobileShell overview={overview} overviewLoading={overviewLoading} title="Общински съвет">
      {!hasScrapedDocuments ? (
        <EmptyState
          icon="bi-building"
          title={`Няма данни от ОбС за ${label}`}
          description="Решения и съветници се събират от smolyan.bg само за Община Смолян. Поръчките и договорите се филтрират по избраната община."
        />
      ) : (
        <>
          <MonitorCouncilStatsCards stats={stats} loading={loading} />
          <section className="mt-8">
            <MonitorCouncilorCards councilors={councilors} loading={loading} />
          </section>
          <section className="mt-8 space-y-4">
            <h2 className="font-display text-[1rem] font-semibold">Хронология</h2>
            {!loading && items.length > 0 && (
              <MonitorListControls
                filters={filters}
                onChange={patch}
                onReset={reset}
                categories={categories}
                riskFlags={[]}
                totalCount={totalCount}
                filteredCount={filtered.length}
                options={{ itemType: false, risk: false, amount: false }}
              />
            )}
            <MonitorCouncilTimeline items={filtered} loading={loading} />
          </section>
        </>
      )}
    </MonitorMobileShell>
  );
}
