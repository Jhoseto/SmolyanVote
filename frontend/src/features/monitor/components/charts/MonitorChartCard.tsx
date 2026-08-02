"use client";

import { cn } from "@/shared/lib/cn";
import type { ReactNode } from "react";

interface MonitorChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

/** Premium chart container — glass depth, soft brand glow. */
export function MonitorChartCard({ title, subtitle, children, className }: MonitorChartCardProps) {
  return (
    <div
      className={cn(
        "monitor-chart-card group relative overflow-hidden rounded-2xl border border-white/70 p-4 md:p-5",
        "bg-gradient-to-br from-white via-white to-slate-50/95",
        "shadow-[0_8px_32px_rgba(15,23,42,0.07),0_2px_6px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.95)]",
        "transition-shadow duration-300 hover:shadow-[0_12px_40px_rgba(15,23,42,0.09),0_4px_12px_rgba(25,134,28,0.06)]",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgba(25,134,28,0.07),transparent_50%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-emerald-200/25 to-transparent blur-2xl"
      />
      <div className="relative">
        <h3 className="font-display text-[0.92rem] font-semibold tracking-tight text-[color:var(--color-text-heading)]">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-1 text-[0.78rem] leading-relaxed text-[color:var(--color-text-muted)]">{subtitle}</p>
        )}
        <div className={cn(subtitle ? "mt-3" : "mt-3")}>{children}</div>
      </div>
    </div>
  );
}
