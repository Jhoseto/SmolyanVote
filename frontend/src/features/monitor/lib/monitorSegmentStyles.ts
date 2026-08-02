import { cn } from "@/shared/lib/cn";

export type MonitorSegmentVariant = "standalone" | "muted";

/** Shared pill/tab styling for Граждански монитор — active = green + white text. */
export function monitorSegmentClass(
  active: boolean,
  opts?: { variant?: MonitorSegmentVariant; className?: string },
) {
  const variant = opts?.variant ?? "standalone";
  return cn(
    "transition",
    active && "monitor-segment-active",
    !active && variant === "standalone" && "monitor-segment-inactive-standalone",
    !active && variant === "muted" && "monitor-segment-inactive-muted",
    opts?.className,
  );
}
