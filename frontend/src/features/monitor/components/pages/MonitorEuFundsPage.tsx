"use client";

import { useEffect, useState } from "react";
import { monitorApi } from "../../api";
import { MonitorEuFundsPanel } from "../MonitorEuFundsPanel";
import { MonitorMobileShell } from "../MonitorMobileShell";
import { useMonitorOverview } from "../../hooks/useMonitorOverview";
import type { MonitorEuFunds } from "../../types";

export function MonitorEuFundsPage() {
  const { overview, loading: overviewLoading } = useMonitorOverview();
  const [data, setData] = useState<MonitorEuFunds | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    monitorApi.euFunds().then(setData).finally(() => setLoading(false));
  }, []);

  return (
    <MonitorMobileShell overview={overview} overviewLoading={overviewLoading} title="ЕС фондове">
      <MonitorEuFundsPanel data={data} loading={loading} />
    </MonitorMobileShell>
  );
}
