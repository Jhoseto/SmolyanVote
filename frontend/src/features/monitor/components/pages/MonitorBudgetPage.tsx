"use client";

import { useState } from "react";
import { MonitorSegmentButton } from "../MonitorSegmentButton";
import { EmptyState } from "@/shared/ui";
import { MonitorBudgetChart } from "../MonitorBudgetChart";
import { MonitorOfficialBudgetPanel } from "../MonitorOfficialBudgetPanel";
import { MonitorBudgetYearFilter } from "../MonitorBudgetYearFilter";
import { MonitorMobileShell } from "../MonitorMobileShell";
import { useMonitorAuthority } from "../MonitorAuthorityProvider";
import { useMonitorOverview } from "../../hooks/useMonitorOverview";
import { useMonitorBudgetData } from "../../hooks/useMonitorBudgetData";
import { resolveYearFilter } from "../../lib/budgetClient";

type BudgetView = "official" | "cpv";

export function MonitorBudgetPage() {
  const { authority } = useMonitorAuthority();
  const { overview, loading: overviewLoading } = useMonitorOverview();
  const { budget, officialBudget, loading, error, yearFilter, setYearFilter, yearOptions } =
    useMonitorBudgetData(authority);
  const [view, setView] = useState<BudgetView>("official");

  const { from } = resolveYearFilter(yearFilter);
  const showOfficialTab = officialBudget != null || view === "official";

  return (
    <MonitorMobileShell
      overview={overview}
      overviewLoading={overviewLoading}
      title="Бюджет и изпълнение"
      contentLoading={loading && !budget}
    >
      <div className="space-y-4">
        <MonitorBudgetYearFilter
          years={yearOptions}
          value={yearFilter}
          onChange={setYearFilter}
        />

        <div className="flex rounded-full border border-border-default/35 bg-[color:var(--color-surface-muted)] p-0.5">
          <MonitorSegmentButton
            active={view === "official"}
            onClick={() => setView("official")}
            className="flex-1 rounded-full px-4 py-2 text-[0.78rem] font-semibold"
          >
            Официален бюджет
          </MonitorSegmentButton>
          <MonitorSegmentButton
            active={view === "cpv"}
            onClick={() => setView("cpv")}
            className="flex-1 rounded-full px-4 py-2 text-[0.78rem] font-semibold"
          >
            CPV / SIGMA
          </MonitorSegmentButton>
        </div>

        {error ? (
          <EmptyState
            icon="bi-exclamation-triangle"
            title="Бюджетът не се зареди"
            description={error}
          />
        ) : view === "official" && showOfficialTab ? (
          <MonitorOfficialBudgetPanel data={officialBudget} year={from} />
        ) : (
          <MonitorBudgetChart budget={budget} loading={loading && !budget} />
        )}
      </div>
    </MonitorMobileShell>
  );
}
