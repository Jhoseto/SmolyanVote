"use client";

import { useEffect, useState } from "react";
import { monitorApi } from "../../api";
import { MonitorBudgetChart } from "../MonitorBudgetChart";
import { MonitorMobileShell } from "../MonitorMobileShell";
import { useMonitorOverview } from "../../hooks/useMonitorOverview";
import type { MonitorBudget } from "../../types";

export function MonitorBudgetPage() {
  const { overview, loading: overviewLoading } = useMonitorOverview();
  const [budget, setBudget] = useState<MonitorBudget | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    monitorApi.budget().then(setBudget).finally(() => setLoading(false));
  }, []);

  return (
    <MonitorMobileShell overview={overview} overviewLoading={overviewLoading} title="Бюджет vs изпълнение">
      <MonitorBudgetChart budget={budget} loading={loading} />
    </MonitorMobileShell>
  );
}
