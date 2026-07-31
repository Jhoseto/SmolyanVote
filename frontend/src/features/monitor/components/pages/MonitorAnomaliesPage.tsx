"use client";

import { useEffect, useState } from "react";
import { LogoLoader } from "@/shared/ui";
import { monitorApi } from "../../api";
import { MonitorFilteredFeedGrid } from "../MonitorFilteredFeedGrid";
import { MonitorMobileShell } from "../MonitorMobileShell";
import { useMonitorAuthority } from "../MonitorAuthorityProvider";
import { useMonitorOverview } from "../../hooks/useMonitorOverview";
import type { MonitorFeedItem } from "../../types";

export function MonitorAnomaliesPage() {
  const { authority } = useMonitorAuthority();
  const { overview, loading: overviewLoading } = useMonitorOverview();
  const [items, setItems] = useState<MonitorFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    monitorApi
      .anomalies(0, 30, authority)
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
    <MonitorMobileShell overview={overview} overviewLoading={overviewLoading} title="Аномалии и риск">
      <p className="text-[0.9rem] text-[color:var(--color-text-secondary)]">
        Договори с risk score ≥ 40 — единствена оферта, необичайно висока стойност, повтарящ се победител.
      </p>
      {loading ? (
        <LogoLoader label="Зареждане…" />
      ) : (
        <MonitorFilteredFeedGrid
          items={items}
          showFlags
          emptyIcon="bi-shield-check"
          emptyTitle="Няма flagged договори"
          emptyDescription="Добър знак — или липсват данни."
          controlOptions={{ itemType: false }}
          initialFilters={{ sort: "risk-desc", minRisk: 40 }}
        />
      )}
    </MonitorMobileShell>
  );
}
