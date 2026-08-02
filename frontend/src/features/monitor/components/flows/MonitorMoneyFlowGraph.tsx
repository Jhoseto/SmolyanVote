"use client";

import dynamic from "next/dynamic";
import type { MonitorFlows } from "../../types";
import { MonitorChartCard } from "../charts";

const MonitorMoneyFlowSankeyChart = dynamic(
  () =>
    import("./MonitorMoneyFlowSankeyChart").then((m) => m.MonitorMoneyFlowSankeyChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-[440px] animate-pulse rounded-xl bg-slate-100/80" aria-busy="true" />
    ),
  },
);

interface MonitorMoneyFlowGraphProps {
  flows: MonitorFlows | null;
  loading?: boolean;
  onAuthorityLinkClick: (source: string, target: string) => void;
}

export function MonitorMoneyFlowGraph({
  flows,
  loading,
  onAuthorityLinkClick,
}: MonitorMoneyFlowGraphProps) {
  if (loading) {
    return (
      <div className="h-[440px] animate-pulse rounded-2xl bg-[color:var(--color-surface-muted)]" />
    );
  }

  if (!flows?.links.length) {
    return (
      <p className="rounded-2xl border border-dashed border-border-default/50 bg-white/80 p-8 text-center text-[0.9rem] text-[color:var(--color-text-muted)]">
        Няма данни за парични потоци. Стартирайте SIGMA import от админ панела.
      </p>
    );
  }

  const subCount = flows.subLinks?.length ?? 0;
  const coverage = flows.subcontractorCoverage;

  return (
    <MonitorChartCard
      title="Кой получава парите на общините?"
      subtitle={`Интерактивна Sankey диаграма — топ потоци по стойност${subCount > 0 ? ` · ${subCount} връзки към подизпълнители` : ""}.`}
    >
      {coverage && coverage.declaredContracts === 0 && (
        <p className="mb-3 rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-[0.78rem] leading-relaxed text-amber-950">
          <strong>Няма декларирани подизпълнители</strong> в текущите данни. SIGMA CSV не съдържа
          тези полета — пуснете <em>Обогати подизпълнители (SIGMA JSON)</em> от админ панела (≈15 мин
          за областта). Допълнително <em>EOP import</em> обогатява по УНП от последните 30 дни.
        </p>
      )}
      {coverage && coverage.declaredContracts > 0 && coverage.withAmountEur === 0 && (
        <p className="mb-3 rounded-lg border border-border-default/30 bg-slate-50 px-3 py-2 text-[0.78rem] text-[color:var(--color-text-muted)]">
          Има {coverage.declaredContracts} договора с деклариран подизпълнител, но без публикувана
          сума или процент в EOP — оранжевите ленти може да липсват.
        </p>
      )}
      <MonitorMoneyFlowSankeyChart flows={flows} onAuthorityLinkClick={onAuthorityLinkClick} />
    </MonitorChartCard>
  );
}
