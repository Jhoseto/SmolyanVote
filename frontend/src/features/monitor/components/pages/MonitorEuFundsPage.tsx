"use client";

import { useEffect, useState } from "react";
import { monitorApi } from "../../api";
import { MonitorEuFundsPanel } from "../MonitorEuFundsPanel";
import { MonitorMobileShell } from "../MonitorMobileShell";
import { useMonitorAuthority } from "../MonitorAuthorityProvider";
import { useMonitorOverview } from "../../hooks/useMonitorOverview";
import type { MonitorEuFunds } from "../../types";

export function MonitorEuFundsPage() {
  const { authority } = useMonitorAuthority();
  const { overview, loading: overviewLoading } = useMonitorOverview();
  const [data, setData] = useState<MonitorEuFunds | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    monitorApi
      .euFunds(authority)
      .then((result) => {
        if (!cancelled) setData(result);
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
      title="ЕС фондове"
      contentLoading={loading}
    >
      <MonitorEuFundsPanel data={data} loading={false} />
    </MonitorMobileShell>
  );
}
