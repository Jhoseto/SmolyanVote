"use client";

import { useEffect, useState } from "react";
import { monitorApi } from "../../api";
import { MonitorConnectionsGraph } from "../MonitorConnectionsGraph";
import { MonitorFlowsChart } from "../MonitorFlowsChart";
import { MonitorMobileShell } from "../MonitorMobileShell";
import { useMonitorAuthority } from "../MonitorAuthorityProvider";
import { useMonitorOverview } from "../../hooks/useMonitorOverview";
import type { MonitorConnections, MonitorFlows } from "../../types";

export function MonitorFlowsPage() {
  const { authority } = useMonitorAuthority();
  const { overview, loading: overviewLoading } = useMonitorOverview();
  const [flows, setFlows] = useState<MonitorFlows | null>(null);
  const [connections, setConnections] = useState<MonitorConnections | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([monitorApi.flows(authority), monitorApi.connections(authority)])
      .then(([flowsData, connectionsData]) => {
        if (cancelled) return;
        setFlows(flowsData);
        setConnections(connectionsData);
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
      title="Парични потоци"
      contentLoading={loading}
    >
      <p className="mb-6 text-[0.9rem] leading-relaxed text-[color:var(--color-text-muted)]">
        Вижте <strong>кои общини плащат на кои фирми</strong> и кои изпълнители получават най-много
        обществени поръчки в област Смолян — данни от SIGMA/EOP, без сурови регистри.
        Колоната „Подизпълнител“ показва декларации от EOP (само едно ниво). Колоната „Защо е важно“
        обяснява <strong>индикатори</strong>, не обвинения.
      </p>
      <div className="space-y-8">
        <MonitorFlowsChart flows={flows} loading={false} />
        <MonitorConnectionsGraph connections={connections} loading={false} />
      </div>
    </MonitorMobileShell>
  );
}
