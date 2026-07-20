import { cn } from "@/shared/lib/cn";

export interface VoteResultRow {
  key: string;
  label: string;
  count: number;
  percent: number;
  active?: boolean;
  colorClass?: string;
}

/** Animated result bars — shared visual across all 3 event types. */
export function VoteResultsBars({ rows }: { rows: VoteResultRow[] }) {
  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => (
        <div key={row.key} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span
              className={cn(
                "font-medium",
                row.active ? "text-primary" : "text-[color:var(--color-text-primary)]",
              )}
            >
              {row.label}
              {row.active && <i className="bi bi-check-circle-fill ml-1.5 text-primary" />}
            </span>
            <span className="shrink-0 text-[color:var(--color-text-muted)]">
              {row.count} · {row.percent}%
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-[var(--radius-pill)] bg-[color:var(--color-surface-muted)]">
            <div
              className={cn(
                "h-full rounded-[var(--radius-pill)] transition-all duration-700 ease-out",
                row.colorClass ?? "bg-[image:var(--gradient-primary)]",
              )}
              style={{ width: `${row.percent}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
