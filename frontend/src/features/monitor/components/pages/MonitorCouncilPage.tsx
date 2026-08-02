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
    monitorApi
      .councilors(authority)
      .then((councilorCards) => {
        if (!cancelled) setCouncilors(councilorCards);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authority]);

  useEffect(() => {
    if (!hasScrapedDocuments) {
      setItems([]);
      setStats(null);
      return;
    }

    let cancelled = false;
    Promise.all([monitorApi.councilTimeline(authority), monitorApi.councilStats(authority)])
      .then(([timeline, councilStats]) => {
        if (cancelled) return;
        setItems(timeline);
        setStats(councilStats);
      });
    return () => {
      cancelled = true;
    };
  }, [authority, hasScrapedDocuments]);

  const councilLabel = authority ? label : "Област Смолян";

  return (
    <MonitorMobileShell
      overview={overview}
      overviewLoading={overviewLoading}
      title="Общински съвет"
      contentLoading={loading}
    >
      <MonitorCouncilorCards councilors={councilors} municipalityLabel={councilLabel} loading={loading} />

      {hasScrapedDocuments ? (
        <>
          <MonitorCouncilStatsCards stats={stats} loading={false} />
          <section className="mt-8 space-y-4">
            <h2 className="font-display text-[1rem] font-semibold">Хронология — {label}</h2>
            {items.length > 0 && (
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
            <MonitorCouncilTimeline items={filtered} loading={false} />
          </section>
        </>
      ) : (
        <section className="mt-8">
          <EmptyState
            icon="bi-journal-text"
            title={`Няма хронология от ОбС за ${label}`}
            description="Решения и протоколи от smolyan.bg се показват само за Община Смолян. Съветниците по-горе са от официални източници за избраната община."
          />
        </section>
      )}
    </MonitorMobileShell>
  );
}
