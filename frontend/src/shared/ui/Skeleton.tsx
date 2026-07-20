import { cn } from "@/shared/lib/cn";

/**
 * Generic loading placeholder. Compose with explicit widths/heights at the
 * call-site — no domain-specific skeleton shapes live here (`shared/` rule).
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse rounded-[var(--radius-sm)] bg-[color:var(--color-surface-muted)]",
        className,
      )}
    />
  );
}
