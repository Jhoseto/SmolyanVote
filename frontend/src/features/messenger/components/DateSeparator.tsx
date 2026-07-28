"use client";

import { cn } from "@/shared/lib/cn";

/** Day marker between message groups; also used as the floating scroll pill. */
export function DateSeparator({ label, floating }: { label: string; floating?: boolean }) {
  return (
    <div className={cn("flex justify-center", floating ? "" : "py-2")}>
      <span
        className={cn(
          "sv-msg-num rounded-[var(--radius-pill)] px-3 py-1 text-[11px] font-medium",
          "bg-white/85 text-[color:var(--color-text-secondary)] shadow-[var(--shadow-sm)]",
          "ring-1 ring-border-default/50 backdrop-blur-sm",
        )}
      >
        {label}
      </span>
    </div>
  );
}
