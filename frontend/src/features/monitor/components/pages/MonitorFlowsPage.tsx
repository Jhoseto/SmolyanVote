"use client";

import { useCallback, useEffect, useState } from "react";
import { monitorApi } from "../../api";
import { MonitorFlowPathPanel, MonitorMoneyFlowGraph } from "../flows";
import { MonitorConnectionsGraph } from "../MonitorConnectionsGraph";
import { MonitorFlowsChart } from "../MonitorFlowsChart";
import { MonitorMobileShell } from "../MonitorMobileShell";
import { useMonitorAuthority } from "../MonitorAuthorityProvider";
import { useMonitorOverview } from "../../hooks/useMonitorOverview";
import type { MonitorConnections, MonitorFlowPathDetail, MonitorFlows } from "../../types";

export function MonitorFlowsPage() {
  const { authority } = useMonitorAuthority();
  const { overview, loading: overviewLoading } = useMonitorOverview();
  const [flows, setFlows] = useState<MonitorFlows | null>(null);
  const [connections, setConnections] = useState<MonitorConnections | null>(null);
  const [loading, setLoading] = useState(true);
  const [pathDetail, setPathDetail] = useState<MonitorFlowPathDetail | null>(null);
  const [pathLoading, setPathLoading] = useState(false);
  const [pathError, setPathError] = useState<string | null>(null);

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

  const handleAuthorityLinkClick = useCallback(
    async (source: string, target: string) => {
      setPathLoading(true);
      setPathError(null);
      setPathDetail(null);
      try {
        const detail = await monitorApi.flowPath(source, target, authority);
        setPathDetail(detail);
      } catch {
        setPathError("Неуспешно зареждане на детайлите за този поток.");
      } finally {
        setPathLoading(false);
      }
    },
    [authority],
  );

  const closePathPanel = useCallback(() => {
    setPathDetail(null);
    setPathError(null);
  }, []);

  return (
    <MonitorMobileShell
      overview={overview}
      overviewLoading={overviewLoading}
      title="Парични потоци"
      contentLoading={loading}
    >
      <p className="mb-6 text-[0.9rem] leading-relaxed text-[color:var(--color-text-muted)]">
        Вижте <strong>кои общини плащат на кои фирми</strong> и как декларираните подизпълнители
        получават част от парите — данни от SIGMA/EOP. Кликнете <strong>лентa община→изпълнител</strong> на списък с
        договори, дати и суми. Подизпълнителите са <strong>само декларирани</strong> (едно ниво);
        няма данни за отделни плащания — показваме стойност на договор и дата на подписване.
      </p>

      <div className="space-y-8">
        <MonitorMoneyFlowGraph
          flows={flows}
          loading={loading}
          onAuthorityLinkClick={handleAuthorityLinkClick}
        />

        <MonitorFlowPathPanel
          detail={pathDetail}
          loading={pathLoading}
          error={pathError}
          onClose={closePathPanel}
        />

        <MonitorFlowsChart flows={flows} loading={loading} collapsedByDefault />

        <MonitorConnectionsGraph connections={connections} loading={loading} />
      </div>
    </MonitorMobileShell>
  );
}
