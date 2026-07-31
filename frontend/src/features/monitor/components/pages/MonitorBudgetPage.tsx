"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/shared/ui";
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    monitorApi
      .budget(authority)
      .then((data) => {
        if (!cancelled) setBudget(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setBudget(null);
          setError(err instanceof Error ? err.message : "Неуспешно зареждане на бюджета");
        }
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
      title="Бюджет vs изпълнение"
      contentLoading={loading}
    >
      {error ? (
        <EmptyState
          icon="bi-exclamation-triangle"
          title="Бюджетът не се зареди"
          description={error}
        />
      ) : (
        <MonitorBudgetChart budget={budget} />
      )}
    </MonitorMobileShell>
  );
}
