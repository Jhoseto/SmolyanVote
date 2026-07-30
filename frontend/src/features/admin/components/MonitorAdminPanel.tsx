"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/shared/lib/cn";
import { MonitorIngestionTab } from "./monitor/MonitorIngestionTab";
import { MonitorDocumentsTab } from "./monitor/MonitorDocumentsTab";
import { MonitorContractsTab } from "./monitor/MonitorContractsTab";
import { MonitorCompaniesTab } from "./monitor/MonitorCompaniesTab";
import { MonitorCouncilorsTab } from "./monitor/MonitorCouncilorsTab";
import { MonitorBudgetTab } from "./monitor/MonitorBudgetTab";
import { MonitorSchedulerTab } from "./monitor/MonitorSchedulerTab";

type MonitorSubTab =
  | "ingestion"
  | "documents"
  | "contracts"
  | "companies"
  | "councilors"
  | "budget"
  | "settings";

const SUB_TABS: { id: MonitorSubTab; label: string; icon: string }[] = [
  { id: "ingestion", label: "Ingestion", icon: "bi-cloud-download" },
  { id: "documents", label: "Документи", icon: "bi-file-earmark-text" },
  { id: "contracts", label: "Договори", icon: "bi-file-earmark-ruled" },
  { id: "companies", label: "Фирми", icon: "bi-building" },
  { id: "councilors", label: "Съветници", icon: "bi-people" },
  { id: "budget", label: "Бюджет", icon: "bi-cash-coin" },
  { id: "settings", label: "Настройки", icon: "bi-gear" },
];

export function MonitorAdminPanel({ enabled }: { enabled: boolean }) {
  const [subTab, setSubTab] = useState<MonitorSubTab>("ingestion");

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-[1.2rem] font-semibold">Граждански монитор</h2>
          <p className="mt-1 max-w-2xl text-[0.9rem] text-[color:var(--color-text-secondary)]">
            Пълен контрол: ingestion, AI, договори, фирми, съветници, бюджет и планировчик — само за администратори.
          </p>
        </div>
        <Link
          href="/monitor"
          target="_blank"
          className="rounded-full border border-primary/25 bg-primary-50 px-4 py-2 text-[0.85rem] font-medium text-primary hover:bg-primary-100"
        >
          Отвори публичния монитор ↗
        </Link>
      </header>

      <nav className="flex flex-wrap gap-1.5 rounded-[var(--radius-lg)] border border-border-default/35 bg-[color:var(--color-surface-muted)] p-1.5">
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSubTab(t.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-[var(--radius-md)] px-3 py-1.5 text-[0.82rem] font-medium transition-colors",
              subTab === t.id
                ? "bg-white text-primary shadow-sm"
                : "text-[color:var(--color-text-secondary)] hover:bg-white/60",
            )}
          >
            <i className={cn("bi", t.icon)} />
            {t.label}
          </button>
        ))}
      </nav>

      {subTab === "ingestion" && <MonitorIngestionTab enabled={enabled} />}
      {subTab === "documents" && <MonitorDocumentsTab enabled={enabled} />}
      {subTab === "contracts" && <MonitorContractsTab enabled={enabled} />}
      {subTab === "companies" && <MonitorCompaniesTab enabled={enabled} />}
      {subTab === "councilors" && <MonitorCouncilorsTab enabled={enabled} />}
      {subTab === "budget" && <MonitorBudgetTab enabled={enabled} />}
      {subTab === "settings" && <MonitorSchedulerTab enabled={enabled} />}
    </div>
  );
}
