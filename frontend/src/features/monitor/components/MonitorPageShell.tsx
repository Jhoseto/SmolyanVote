"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/cn";
import { Container } from "@/shared/ui";
import type { MonitorTab } from "../types";
import { MonitorKpiStrip } from "./MonitorKpiStrip";
import { useMonitorAuthority } from "./MonitorAuthorityProvider";
import { MonitorMunicipalityFilter } from "./MonitorMunicipalityFilter";
import type { MonitorOverview } from "../types";

const TABS: { id: MonitorTab; href: string; label: string; icon: string }[] = [
  { id: "all", href: "/monitor", label: "Анализ", icon: "bi-grid" },
  { id: "procurement", href: "/monitor/procurement", label: "Поръчки", icon: "bi-basket" },
  { id: "anomalies", href: "/monitor/anomalies", label: "Аномалии", icon: "bi-exclamation-diamond" },
  { id: "flows", href: "/monitor/flows", label: "Потоци", icon: "bi-diagram-3" },
  { id: "council", href: "/monitor/council", label: "ОбС", icon: "bi-building" },
  { id: "consultations", href: "/monitor/consultations", label: "Обсъждания", icon: "bi-people" },
  { id: "deadlines", href: "/monitor/deadlines", label: "Срокове", icon: "bi-calendar-event" },
  { id: "region", href: "/monitor/region", label: "Регион", icon: "bi-map" },
  { id: "budget", href: "/monitor/budget", label: "Бюджет", icon: "bi-pie-chart" },
  { id: "eu-funds", href: "/monitor/eu-funds", label: "ЕС", icon: "bi-flag" },
  { id: "methodology", href: "/monitor/methodology", label: "Методология", icon: "bi-info-circle" },
];

interface MonitorPageShellProps {
  children: React.ReactNode;
  overview?: MonitorOverview | null;
  overviewLoading?: boolean;
  showKpi?: boolean;
  title?: string;
}

export function MonitorPageShell({
  children,
  overview,
  overviewLoading,
  showKpi = true,
  title,
}: MonitorPageShellProps) {
  const pathname = usePathname();
  const { authority, label, withAuthority } = useMonitorAuthority();

  return (
    <div className="pb-16 pt-[calc(var(--navbar-height)+1.5rem)]">
      <Container className="space-y-6">
        <header className="space-y-2">
          <p className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-primary">
            Граждански монитор
          </p>
          <h1 className="font-display text-[clamp(1.75rem,4vw,2.35rem)] font-bold tracking-tight text-[color:var(--color-text-heading)]">
            {title ?? "Прозрачност за Смолян и региона"}
          </h1>
          <p className="max-w-2xl text-[0.95rem] text-[color:var(--color-text-secondary)]">
            {authority
              ? `Поръчки, решения и разходи на ${label} — структурирани, проверими, на прост език.`
              : "Поръчки, решения и разходи в област Смолян — структурирани, проверими, на прост език."}
          </p>
        </header>

        <MonitorMunicipalityFilter />

        {showKpi && <MonitorKpiStrip overview={overview ?? null} loading={overviewLoading} />}

        <nav
          aria-label="Секции на монитора"
          className="-mx-1 flex gap-1 overflow-x-auto pb-1 scrollbar-none"
        >
          {TABS.map((tab) => {
            const active =
              tab.href === "/monitor"
                ? pathname === "/monitor"
                : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.id}
                href={withAuthority(tab.href)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[0.8rem] font-medium transition",
                  active
                    ? "bg-primary text-white shadow-[0_4px_14px_rgba(25,134,28,0.25)]"
                    : "bg-white/80 text-[color:var(--color-text-secondary)] hover:bg-primary-50 hover:text-primary",
                )}
              >
                <i className={cn("bi", tab.icon)} />
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {children}
      </Container>
    </div>
  );
}
