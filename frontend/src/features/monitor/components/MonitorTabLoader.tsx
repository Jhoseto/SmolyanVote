"use client";

import { LogoLoader } from "@/shared/ui";

interface MonitorTabLoaderProps {
  label?: string;
}

/** Consistent loader for monitor tab content (below KPI + tab nav). */
export function MonitorTabLoader({ label = "Зареждане…" }: MonitorTabLoaderProps) {
  return (
    <div
      className="flex min-h-[min(420px,55vh)] items-center justify-center rounded-[var(--radius-lg)] border border-border-default/20 bg-white/50 py-16"
      aria-busy="true"
    >
      <LogoLoader label={label} size="md" />
    </div>
  );
}
