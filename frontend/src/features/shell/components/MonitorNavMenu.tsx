"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/shared/lib/cn";

const DOCS_ITEMS = [
  {
    href: "/monitor",
    icon: "bi-grid",
    title: "Всичко",
    description: "Feed с поръчки и документи",
  },
  {
    href: "/monitor/council",
    icon: "bi-building",
    title: "Общински съвет",
    description: "Решения и протоколи",
  },
  {
    href: "/monitor/consultations",
    icon: "bi-people",
    title: "Обсъждания",
    description: "Обществени консултации",
  },
  {
    href: "/monitor/deadlines",
    icon: "bi-calendar-event",
    title: "Срокове",
    description: "Календар на крайни дати",
  },
] as const;

const ANALYSIS_ITEMS = [
  {
    href: "/monitor/procurement",
    icon: "bi-basket",
    title: "Поръчки",
    description: "Договори и статистики",
  },
  {
    href: "/monitor/anomalies",
    icon: "bi-exclamation-diamond",
    title: "Аномалии",
    description: "Flagged договори",
  },
  {
    href: "/monitor/flows",
    icon: "bi-diagram-3",
    title: "Парични потоци",
    description: "Общини → фирми, топ суми",
  },
  {
    href: "/monitor/region",
    icon: "bi-map",
    title: "Регион",
    description: "Сравнение между общини",
  },
] as const;

function MenuRow({
  icon,
  title,
  description,
  href,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  href: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group/row flex w-full items-start gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-left transition-colors hover:bg-primary-50/80"
    >
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-primary/12 bg-primary-50 text-primary">
        <i className={cn("bi", icon, "text-[1.05rem]")} />
      </span>
      <span className="min-w-0">
        <span className="block font-display text-[0.9rem] font-semibold text-[color:var(--color-text-heading)]">
          {title}
        </span>
        <span className="mt-0.5 block text-[0.75rem] leading-snug text-[color:var(--color-text-secondary)]">
          {description}
        </span>
      </span>
    </Link>
  );
}

export function MonitorNavMenuPanel({
  onNavigate,
  layout = "dropdown",
}: {
  onNavigate?: () => void;
  layout?: "dropdown" | "drawer";
}) {
  function handleNav() {
    onNavigate?.();
  }

  return (
    <div className={cn(layout === "drawer" ? "grid grid-cols-1" : "grid sm:grid-cols-2")}>
      <div
        className={cn(
          "border-border-default/50 p-4",
          layout === "drawer" ? "border-b" : "border-b sm:border-b-0 sm:border-r sm:p-5",
        )}
      >
        <p className="mb-3 flex items-center gap-2 font-display text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-primary">
          <i className="bi bi-journal-text" />
          Документи
        </p>
        <div className="flex flex-col gap-0.5">
          {DOCS_ITEMS.map((item) => (
            <MenuRow key={item.href} {...item} onClick={handleNav} />
          ))}
        </div>
      </div>
      <div className="flex flex-col p-4 sm:p-5">
        <p className="mb-3 flex items-center gap-2 font-display text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-primary">
          <i className="bi bi-graph-up" />
          Поръчки и анализ
        </p>
        <div className="flex flex-1 flex-col gap-0.5">
          {ANALYSIS_ITEMS.map((item) => (
            <MenuRow key={item.href} {...item} onClick={handleNav} />
          ))}
        </div>
        <Link
          href="/monitor"
          onClick={handleNav}
          className="btn-brand mt-4 inline-flex items-center justify-center gap-2 rounded-[var(--radius-pill)] px-4 py-2.5 text-sm font-semibold shadow-[var(--shadow-md)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]"
        >
          Отвори монитора
          <i className="bi bi-arrow-right" />
        </Link>
      </div>
    </div>
  );
}

export function MonitorNavMenu({
  label,
  onNavigate,
  className,
  layout = "dropdown",
  drawerPart = "combined",
  open: controlledOpen,
  onOpenChange,
}: {
  label: string;
  onNavigate?: () => void;
  className?: string;
  layout?: "dropdown" | "drawer";
  drawerPart?: "combined" | "trigger" | "panel";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const active = pathname.startsWith("/monitor");

  useEffect(() => {
    if (layout !== "dropdown") return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [layout, setOpen]);

  if (layout === "drawer" && drawerPart === "panel") {
    return <MonitorNavMenuPanel onNavigate={onNavigate} layout="drawer" />;
  }

  const panelContent = <MonitorNavMenuPanel onNavigate={onNavigate} layout={layout} />;

  return (
    <div ref={ref} className={cn(layout === "dropdown" && "relative", className)}>
      {(layout === "dropdown" || drawerPart !== "panel") && (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className={cn(
            "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 font-sans text-[0.875rem] font-light tracking-wide text-[color:var(--color-text-nav-muted)] transition-all duration-200 hover:bg-black/[0.035] hover:text-primary",
            layout === "drawer" && "min-h-[44px] w-full justify-start rounded-[12px] px-3 text-[0.95rem] text-[color:var(--color-text-nav)]",
            (open || active) && "bg-primary-50 text-primary",
          )}
        >
          <i className={cn("bi bi-shield-check text-[1.05rem]", active ? "text-primary" : "", layout === "drawer" && "text-[1.2rem]")} />
          <span>{label}</span>
          <i
            className={cn(
              "bi bi-chevron-down text-[0.65rem] transition-transform",
              open && "rotate-180",
              layout === "drawer" && "ml-auto text-xs",
            )}
          />
        </button>
      )}

      {layout === "drawer" && drawerPart === "combined" && open ? (
        <div className="mt-1 overflow-hidden rounded-[var(--radius-md)] border border-border-default/50 bg-white shadow-sm">
          {panelContent}
        </div>
      ) : null}

      {layout === "dropdown" && (
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="absolute left-1/2 top-[calc(100%+12px)] z-[1040] w-[min(94vw,580px)] -translate-x-1/2 overflow-hidden rounded-[var(--radius-lg)] border border-border-default/50 bg-white/95 shadow-[var(--shadow-dropdown)] backdrop-blur-md"
            >
              {panelContent}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
