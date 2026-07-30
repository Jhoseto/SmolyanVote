"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { EmptyState, LogoLoader } from "@/shared/ui";
import { monitorApi } from "../../api";
import { formatEur } from "../../lib/format";
import { MonitorConnectionsGraph } from "../MonitorConnectionsGraph";
import { MonitorInsightCard } from "../MonitorInsightCard";
import { RiskBadgeChip } from "../MonitorKpiStrip";
import type { MonitorCompanyDetail, MonitorConnections } from "../../types";

export function MonitorCompanyPage() {
  const params = useParams();
  const eik = String(params.eik || "");
  const [company, setCompany] = useState<MonitorCompanyDetail | null>(null);
  const [connections, setConnections] = useState<MonitorConnections | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!eik) {
      setError(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    Promise.all([monitorApi.company(eik), monitorApi.companyConnections(eik)])
      .then(([c, graph]) => {
        if (!cancelled) {
          setCompany(c);
          setConnections(graph);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [eik]);

  if (loading) return <LogoLoader fullScreen label="Зареждане…" />;
  if (error || !company) {
    return (
      <div className="pt-24">
        <EmptyState icon="bi-building" title="Фирмата не е намерена" />
      </div>
    );
  }

  return (
    <div className="pb-16 pt-[calc(var(--navbar-height)+1.5rem)]">
      <div className="mx-auto max-w-3xl space-y-6 px-4">
        <Link href="/monitor/procurement" className="text-[0.85rem] text-primary hover:underline">
          ← Поръчки
        </Link>
        <header>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-[1.35rem] font-bold">{company.name}</h1>
            {company.compositeRiskScore != null && <RiskBadgeChip score={company.compositeRiskScore} />}
          </div>
          <p className="text-[0.85rem] text-[color:var(--color-text-muted)]">ЕИК {company.eik}</p>
          {company.compositeRiskScore != null && (
            <p className="mt-1 text-[0.75rem] text-[color:var(--color-text-muted)]">
              CRI — среден рисков индекс по договорите на фирмата в региона
            </p>
          )}
          {company.legalForm && (
            <p className="mt-1 text-[0.82rem] text-[color:var(--color-text-secondary)]">
              {company.legalForm}
              {company.registryStatus ? ` · ${company.registryStatus}` : ""}
            </p>
          )}
          {company.registeredAddress && (
            <p className="mt-1 text-[0.78rem] text-[color:var(--color-text-muted)]">{company.registeredAddress}</p>
          )}
          {company.managersSummary && (
            <p className="mt-1 text-[0.78rem] text-[color:var(--color-text-secondary)]">
              Управление: {company.managersSummary}
            </p>
          )}
          <p className="mt-2 font-display text-[1.4rem] font-bold text-primary">
            {formatEur(company.totalWonEur)} · {company.contractCount} договора
          </p>
        </header>

        <MonitorConnectionsGraph connections={connections} title="Връзки на фирмата" compact />

        <section className="grid gap-3">
          {company.recentContracts.map((item) => (
            <MonitorInsightCard key={item.id} item={item} />
          ))}
        </section>
      </div>
    </div>
  );
}
