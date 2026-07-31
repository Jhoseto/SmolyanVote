"use client";

import { useEffect, useState } from "react";
import { monitorApi } from "../../api";
import { MonitorMobileShell } from "../MonitorMobileShell";
import { MonitorRegionalComparisonChart } from "../MonitorRegionalComparisonChart";
import { useMonitorAuthority } from "../MonitorAuthorityProvider";
import { useMonitorOverview } from "../../hooks/useMonitorOverview";
import type { MonitorRegionalComparison } from "../../types";

export function MonitorRegionPage() {
  const { authority, label } = useMonitorAuthority();
  const { overview, loading: overviewLoading } = useMonitorOverview();
  const [data, setData] = useState<MonitorRegionalComparison | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    monitorApi
      .regionalComparison()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <MonitorMobileShell overview={overview} overviewLoading={overviewLoading} title="Регионално сравнение">
      {authority && (
        <p className="mb-4 rounded-[var(--radius-md)] border border-border-default/35 bg-white/90 px-3 py-2 text-[0.82rem] text-[color:var(--color-text-secondary)]">
          Сравнението винаги показва всички 8 общини. Филтърът „{label}“ важи за останалите секции.
        </p>
      )}
      <MonitorRegionalComparisonChart data={data} loading={loading} />
      {!loading && (data?.municipalities.length ?? 0) <= 1 && (
        <p className="mt-4 text-[0.82rem] text-[color:var(--color-text-muted)]">
          Пуснете SIGMA import от админ панела, за да се заредят данни за всички 8 общини в област Смолян.
        </p>
      )}
    </MonitorMobileShell>
  );
}
