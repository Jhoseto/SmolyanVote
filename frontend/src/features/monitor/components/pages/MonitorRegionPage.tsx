"use client";

import { useEffect, useState } from "react";
import { monitorApi } from "../../api";
import { MonitorMobileShell } from "../MonitorMobileShell";
import { MonitorRegionalComparisonChart } from "../MonitorRegionalComparisonChart";
import { useMonitorOverview } from "../../hooks/useMonitorOverview";
import type { MonitorRegionalComparison } from "../../types";

export function MonitorRegionPage() {
  const { overview, loading: overviewLoading } = useMonitorOverview();
  const [data, setData] = useState<MonitorRegionalComparison | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    monitorApi.regionalComparison().then(setData).finally(() => setLoading(false));
  }, []);

  return (
    <MonitorMobileShell overview={overview} overviewLoading={overviewLoading} title="Регионално сравнение">
      <MonitorRegionalComparisonChart data={data} loading={loading} />
      {!loading && (data?.municipalities.length ?? 0) <= 1 && (
        <p className="mt-4 text-[0.82rem] text-[color:var(--color-text-muted)]">
          Пуснете SIGMA import от админ панела, за да се заредят данни за всички 8 общини в област Смолян.
        </p>
      )}
    </MonitorMobileShell>
  );
}
