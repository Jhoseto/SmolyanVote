"use client";

import { useEffect, useState } from "react";
import { monitorApi } from "../../api";
import { MonitorFilteredFeedGrid } from "../MonitorFilteredFeedGrid";
import { MonitorMobileShell } from "../MonitorMobileShell";
import { useMonitorAuthority } from "../MonitorAuthorityProvider";
import { useMonitorOverview } from "../../hooks/useMonitorOverview";
import type { MonitorFeedItem } from "../../types";

export function MonitorConsultationsPage() {
  const { authority, hasScrapedDocuments, label } = useMonitorAuthority();
  const { overview, loading: overviewLoading } = useMonitorOverview();
  const [items, setItems] = useState<MonitorFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    monitorApi
      .consultations(0, authority)
      .then((p) => {
        if (!cancelled) setItems(p.items);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authority]);

  return (
    <MonitorMobileShell
      overview={overview}
      overviewLoading={overviewLoading}
      title="Обществени обсъждания"
      contentLoading={loading && hasScrapedDocuments}
    >
      {!hasScrapedDocuments ? (
        <EmptyStateNoScrape label={label} />
      ) : (
        <MonitorFilteredFeedGrid
          items={items}
          emptyIcon="bi-people"
          emptyTitle="Няма обсъждания"
          emptyDescription="Ще се попълнят от smolyan.bg scraper."
          controlOptions={{ itemType: false, risk: false, amount: false }}
          initialFilters={{ sort: "newest" }}
        />
      )}
    </MonitorMobileShell>
  );
}

function EmptyStateNoScrape({ label }: { label: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-dashed border-border-default/50 bg-white/80 p-8 text-center">
      <i className="bi bi-people mb-2 text-2xl text-[color:var(--color-text-muted)]" />
      <p className="font-medium">Няма обсъждания за {label}</p>
      <p className="mt-1 text-[0.85rem] text-[color:var(--color-text-muted)]">
        Обществените обсъждания се събират от smolyan.bg само за Община Смолян.
      </p>
    </div>
  );
}
