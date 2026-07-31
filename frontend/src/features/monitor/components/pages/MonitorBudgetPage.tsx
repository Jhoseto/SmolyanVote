"use client";

import { useEffect, useState } from "react";
import { monitorApi } from "../../api";
import { MonitorBudgetChart } from "../MonitorBudgetChart";
import { MonitorMobileShell } from "../MonitorMobileShell";
import { useMonitorAuthority } from "../MonitorAuthorityProvider";
import { useMonitorOverview } from "../../hooks/useMonitorOverview";
import type { MonitorBudget } from "../../types";

export function MonitorBudgetPage() {
  const { authority } = useMonitorAuthority();
  const { overview, loading: overviewLoading } = useMonitorOverview();
  const [budget, setBudget] = useState<MonitorBudget | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    monitorApi
      .budget(authority)
      .then((data) => {
        if (!cancelled) setBudget(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authority]);

  return (
    <MonitorMobileShell overview={overview} overviewLoading={overviewLoading} title="Бюджет vs изпълнение">
      <MonitorBudgetChart budget={budget} loading={loading} />
    </MonitorMobileShell>
  );
}
