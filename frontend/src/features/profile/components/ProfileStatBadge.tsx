"use client";

import { useCountUp } from "../hooks/useCountUp";
import { cn } from "@/shared/lib/cn";

interface ProfileStatBadgeProps {
  icon: string;
  value: number;
  label: string;
  onClick?: () => void;
}

/** Count-up stat pill (legacy `animateCounters()` port) — also usable as a tab-switch trigger (followers/following). */
export function ProfileStatBadge({ icon, value, label, onClick }: ProfileStatBadgeProps) {
  const { ref, display } = useCountUp<HTMLButtonElement>(value);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "flex flex-col items-center gap-0.5 rounded-[var(--radius-md)] px-3 py-1.5 text-center transition-colors disabled:cursor-default",
        onClick && "hover:bg-[color:var(--color-surface-muted)]",
      )}
    >
      <span className="flex items-center gap-1.5 text-lg font-bold text-[color:var(--color-text-heading)]">
        <i className={`bi ${icon} text-sm text-primary`} />
        {display}
      </span>
      <span className="text-xs text-[color:var(--color-text-muted)]">{label}</span>
    </button>
  );
}
