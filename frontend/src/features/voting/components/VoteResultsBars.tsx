import { cn } from "@/shared/lib/cn";

export interface VoteResultRow {
  key: string;
  label: string;
  count: number;
  percent: number;
  active?: boolean;
  colorClass?: string;
  /** Bootstrap icon class (e.g. `bi-hand-thumbs-up`) instead of row number. */
  iconClass?: string;
}

interface VoteResultsBarsProps {
  rows: VoteResultRow[];
  /** Click a row to vote (referendum / simple). */
  interactive?: boolean;
  onSelect?: (index: number) => void;
  /** Multi-poll: highlight toggled rows (0-based indices). */
  selectedIndices?: number[];
  /** Multi-poll: toggle instead of single select. */
  multiSelect?: boolean;
  disabled?: boolean;
  hint?: string;
  totalVotes?: number;
}

/** Result bars — optionally doubles as the vote control (no duplicate labels). */
export function VoteResultsBars({
  rows,
  interactive = false,
  onSelect,
  selectedIndices = [],
  multiSelect = false,
  disabled = false,
  hint,
  totalVotes,
}: VoteResultsBarsProps) {
  const computedTotal =
    totalVotes ?? rows.reduce((sum, row) => sum + row.count, 0);

  function isRowSelected(index: number) {
    return selectedIndices.includes(index);
  }

  function handleRowClick(index: number) {
    if (!interactive || disabled || !onSelect) return;
    onSelect(index);
  }

  return (
    <div className="flex flex-col gap-3">
      {(hint || computedTotal > 0 || interactive) && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-[14px] bg-[#f6faf7] px-3.5 py-2.5 ring-1 ring-primary/10">
          {hint ? (
            <p className="text-[0.78rem] font-light tracking-wide text-[color:var(--color-text-secondary)]">
              <i className="bi bi-hand-index-thumb mr-1.5 text-primary" />
              {hint}
            </p>
          ) : (
            <span />
          )}
          <span className="shrink-0 font-sans text-[0.72rem] tabular-nums text-[color:var(--color-text-muted)]">
            Общо {computedTotal} {computedTotal === 1 ? "глас" : "гласа"}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {rows.map((row, index) => {
          const selected = isRowSelected(index);
          const clickable = interactive && !disabled && !!onSelect;
          const showActive = row.active || selected;

          const Wrapper = clickable ? "button" : "div";

          return (
            <Wrapper
              key={row.key}
              type={clickable ? "button" : undefined}
              disabled={clickable ? disabled : undefined}
              onClick={clickable ? () => handleRowClick(index) : undefined}
              className={cn(
                "group relative w-full overflow-hidden rounded-[16px] border px-3.5 py-3 text-left transition-all duration-200",
                showActive
                  ? "border-primary/35 bg-primary-50/70 shadow-[0_8px_24px_-16px_rgba(25,134,28,0.55)]"
                  : "border-black/[0.06] bg-white hover:border-primary/25 hover:bg-[#fafdfb]",
                clickable && "cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-18px_rgba(25,134,28,0.45)]",
                clickable && selected && multiSelect && "border-primary bg-primary-50/80",
                disabled && "opacity-60",
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] text-[0.78rem] font-semibold tabular-nums",
                    showActive
                      ? "bg-primary text-white shadow-[0_6px_14px_-8px_rgba(25,134,28,0.9)]"
                      : "bg-[#eef5f0] text-primary ring-1 ring-primary/12",
                  )}
                >
                  {row.iconClass ? (
                    <i className={cn("bi text-[0.95rem]", row.iconClass)} />
                  ) : multiSelect && interactive && !row.active ? (
                    <i className={cn("bi text-[0.9rem]", selected ? "bi-check-lg" : "bi-plus")} />
                  ) : (
                    index + 1
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={cn(
                        "text-pretty text-[0.88rem] leading-snug",
                        showActive
                          ? "font-semibold text-[color:var(--color-text-heading)]"
                          : "font-medium text-[color:var(--color-text-primary)]",
                      )}
                    >
                      {row.label}
                      {row.active && (
                        <i className="bi bi-check-circle-fill ml-1.5 inline text-primary" aria-hidden />
                      )}
                    </span>
                    <span className="shrink-0 pt-0.5 font-sans text-[0.75rem] tabular-nums text-[color:var(--color-text-muted)]">
                      {row.count}
                      <span className="mx-1 text-black/20">·</span>
                      {row.percent}%
                    </span>
                  </div>

                  <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-black/[0.06]">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700 ease-out",
                        row.colorClass ?? "bg-[image:var(--gradient-primary)]",
                        row.percent === 0 && "opacity-30",
                      )}
                      style={{ width: `${Math.max(row.percent, row.active ? 4 : 0)}%` }}
                    />
                  </div>
                </div>
              </div>
            </Wrapper>
          );
        })}
      </div>
    </div>
  );
}
