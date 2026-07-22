import { cn } from "@/shared/lib/cn";
import { priorityShortLabel } from "../lib/computePriorityLevel";
import type { PriorityTier } from "../types";

const TIER_STYLES: Record<PriorityTier, string> = {
  low: "bg-primary-50 text-primary-800 ring-primary/25 shadow-[0_2px_8px_rgba(13,110,253,0.08)]",
  medium: "bg-amber-50 text-amber-900 ring-amber-300/50 shadow-[0_2px_8px_rgba(245,158,11,0.1)]",
  high: "bg-red-50 text-red-800 ring-red-300/60 shadow-[0_2px_10px_rgba(239,68,68,0.12)]",
};

const TIER_ICONS: Record<PriorityTier, string> = {
  low: "bi-dash-circle",
  medium: "bi-arrow-up-circle",
  high: "bi-exclamation-circle-fill",
};

interface PriorityBadgeProps {
  tier: PriorityTier;
  size?: "sm" | "md";
  className?: string;
}

export function PriorityBadge({ tier, size = "sm", className }: PriorityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--radius-pill)] font-semibold ring-1 ring-inset",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        TIER_STYLES[tier],
        tier === "high" && "motion-safe:animate-[pulse_2.5s_ease-in-out_infinite]",
        className,
      )}
    >
      <i className={cn("bi", TIER_ICONS[tier])} />
      {priorityShortLabel(tier)}
    </span>
  );
}
