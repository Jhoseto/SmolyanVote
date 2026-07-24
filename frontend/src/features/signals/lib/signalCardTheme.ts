import type { Signal } from "../types";
import type { PriorityTier } from "../types";

export const SIGNAL_BRAND = {
  primary: "#19861c",
  primaryLight: "#48a24c",
  primaryMuted: "#ecfdf3",
} as const;

export function tierAccentColor(tier: Signal["priorityTier"]): string {
  if (tier === "high") return "#ef4444";
  if (tier === "medium") return "#f59e0b";
  return SIGNAL_BRAND.primary;
}

export function tierHeroGradient(tier: Signal["priorityTier"], isActive: boolean): string {
  if (!isActive) return "linear-gradient(135deg,#475569,#64748b,#94a3b8)";
  if (tier === "high") return "linear-gradient(135deg,#7f1d1d,#dc2626,#f87171)";
  if (tier === "medium") return "linear-gradient(135deg,#92400e,#d97706,#fbbf24)";
  return `linear-gradient(135deg,#14532d,${SIGNAL_BRAND.primary},${SIGNAL_BRAND.primaryLight})`;
}

export function priorityShortLabel(tier: PriorityTier): string {
  switch (tier) {
    case "high":
      return "Висок";
    case "medium":
      return "Среден";
    default:
      return "Нисък";
  }
}

export function formatDistanceKm(km: number | null | undefined): string | null {
  if (km == null) return null;
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}
