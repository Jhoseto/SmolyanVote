"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIsMobile } from "@/shared/hooks/useMediaQuery";
import { cn } from "@/shared/lib/cn";
import { useMonitorAuthority } from "./MonitorAuthorityProvider";
import { MonitorPageShell } from "./MonitorPageShell";
import "./monitor-mobile.css";

interface MonitorMobileShellProps {
  children: React.ReactNode;
  overview?: Parameters<typeof MonitorPageShell>[0]["overview"];
  overviewLoading?: boolean;
  title?: string;
  showKpi?: boolean;
  contentLoading?: boolean;
  loadingLabel?: string;
}

const MOBILE_TABS = [
  { href: "/monitor", label: "Начало", icon: "bi-grid", match: (p: string) => p === "/monitor" },
  {
    href: "/monitor/procurement",
    label: "Поръчки",
    icon: "bi-basket",
    match: (p: string) => p.startsWith("/monitor/procurement") || p.startsWith("/monitor/contract"),
  },
  {
    href: "/monitor/council",
    label: "ОбС",
    icon: "bi-building",
    match: (p: string) => p.startsWith("/monitor/council") || p.startsWith("/monitor/document"),
  },
  {
    href: "/monitor/anomalies",
    label: "Риск",
    icon: "bi-exclamation-diamond",
    match: (p: string) => p.startsWith("/monitor/anomalies"),
  },
  {
    href: "/monitor/flows",
    label: "Още",
    icon: "bi-three-dots",
    match: (p: string) =>
      p.startsWith("/monitor/flows") ||
      p.startsWith("/monitor/region") ||
      p.startsWith("/monitor/budget") ||
      p.startsWith("/monitor/eu-funds") ||
      p.startsWith("/monitor/consultations") ||
      p.startsWith("/monitor/deadlines") ||
      p.startsWith("/monitor/methodology") ||
      p.startsWith("/monitor/search"),
  },
] as const;

export function MonitorMobileShell(props: MonitorMobileShellProps) {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const { withAuthority } = useMonitorAuthority();

  return (
    <div className={cn(isMobile && "monitor-mobile pb-[calc(4.5rem+env(safe-area-inset-bottom))]")}>
      <MonitorPageShell {...props} />
      {isMobile && (
        <nav
          aria-label="Монитор навигация"
          className="monitor-mobile-tabbar fixed inset-x-0 bottom-0 z-[900] border-t border-border-default/40 bg-white/95 backdrop-blur-md"
        >
          <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
            {MOBILE_TABS.map((tab) => {
              const active = tab.match(pathname);
              return (
                <Link
                  key={tab.href}
                  href={withAuthority(tab.href)}
                  className={cn(
                    "flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-2.5 text-[0.62rem] font-medium transition",
                    active ? "text-primary" : "text-[color:var(--color-text-muted)]",
                  )}
                >
                  <i className={cn("bi text-[1.15rem]", tab.icon, active && "scale-110")} />
                  <span className="truncate">{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
