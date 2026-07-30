"use client";

import { useEffect, useState } from "react";
import { monitorApi } from "../../api";
import { MonitorConnectionsGraph } from "../MonitorConnectionsGraph";
import { MonitorFlowsChart } from "../MonitorFlowsChart";
import { MonitorMobileShell } from "../MonitorMobileShell";
import { useMonitorOverview } from "../../hooks/useMonitorOverview";
import type { MonitorConnections, MonitorFlows } from "../../types";

export function MonitorFlowsPage() {
  const { overview, loading: overviewLoading } = useMonitorOverview();
  const [flows, setFlows] = useState<MonitorFlows | null>(null);
  const [connections, setConnections] = useState<MonitorConnections | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([monitorApi.flows(), monitorApi.connections()])
      .then(([flowsData, connectionsData]) => {
        setFlows(flowsData);
        setConnections(connectionsData);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <MonitorMobileShell overview={overview} overviewLoading={overviewLoading} title="Парични потоци">
      <div className="space-y-8">
        <MonitorFlowsChart flows={flows} loading={loading} />
        <MonitorConnectionsGraph connections={connections} loading={loading} />
      </div>
    </MonitorMobileShell>
  );
}
