"use client";

import { Avatar } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { formatRelativeDate } from "@/shared/lib/formatRelativeDate";
import { categoryIcon } from "../data/categories";
import { tierAccentColor } from "../lib/signalCardTheme";
import { PriorityBadge } from "./PriorityBadge";
import type { Signal } from "../types";

interface SignalCardProps {
  signal: Signal;
  isSelected: boolean;
  onSelect: () => void;
  /** Denser spacing/typography for grid layouts with many cards per row. */
  compact?: boolean;
}

function tierHeroClass(tier: Signal["priorityTier"], isActive: boolean): string {
  if (!isActive) return "from-slate-700 via-slate-500 to-slate-400";
  if (tier === "high") return "from-[#7f1d1d] via-[#dc2626] to-[#fca5a5]";
  if (tier === "medium") return "from-[#78350f] via-[#d97706] to-[#fcd34d]";
  return "from-[#0f3d12] via-[#19861c] to-[#7bc47f]";
}

function StatCoin({
  icon,
  value,
  accent,
  compact,
}: {
  icon: string;
  value: number | string;
  accent?: boolean;
  compact?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5 py-1.5">
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full",
          compact ? "h-5 w-5 text-[0.6rem]" : "h-6 w-6 text-[0.65rem]",
          accent
            ? "bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-[0_2px_6px_rgba(25,134,28,0.4)]"
            : "bg-white text-[color:var(--color-text-secondary)] shadow-[0_1px_3px_rgba(15,23,42,0.12)]",
        )}
      >
        <i className={cn("bi", icon)} />
      </span>
      <span
        className={cn(
          "truncate font-bold tabular-nums text-[color:var(--color-text-heading)]",
          compact ? "text-[0.76rem]" : "text-[0.86rem]",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function SignalCard({ signal, isSelected, onSelect, compact }: SignalCardProps) {
  const heroGradient = tierHeroClass(signal.priorityTier, signal.isActive);
  const accent = tierAccentColor(signal.priorityTier);
  const isUrgent = signal.isActive && signal.priorityTier === "high";

  return (
    <button type="button" onClick={onSelect} className="group block h-full w-full text-left">
      <div
        className={cn(
          "relative h-full rounded-[22px] bg-gradient-to-br p-px transition-all duration-300",
          "from-black/[0.07] via-black/[0.04] to-black/[0.09]",
          "group-hover:from-primary/50 group-hover:via-primary-300/40 group-hover:to-primary/60",
          isSelected && "from-primary/70 via-primary-300/50 to-primary/80",
        )}
      >
        <article
          className={cn(
            "relative flex h-full flex-col overflow-hidden rounded-[21px] bg-white transition-all duration-300",
            "shadow-[0_12px_32px_-18px_rgba(15,23,42,0.28)]",
            "group-hover:-translate-y-1 group-hover:shadow-[0_28px_52px_-20px_rgba(25,134,28,0.38)]",
            isSelected && "shadow-[0_22px_54px_-18px_rgba(25,134,28,0.42)]",
            isUrgent && !isSelected && "shadow-[0_14px_36px_-16px_rgba(220,38,38,0.32)]",
            !signal.isActive && "opacity-[0.94] saturate-[0.85]",
          )}
        >
          {/* ─── Hero ─── */}
          <div className={cn("relative overflow-hidden", compact ? "h-[6.25rem]" : "h-[9rem]")}>
            {signal.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={signal.imageUrl}
                alt=""
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
              />
            ) : (
              <div className={cn("relative flex h-full w-full items-center justify-center bg-gradient-to-br", heroGradient)}>
                <div className="pointer-events-none absolute inset-0 opacity-[0.15] [background-image:radial-gradient(circle_at_20%_20%,white,transparent_45%)]" />
                <i
                  className={cn(
                    "bi drop-shadow-sm text-white/40 transition-transform duration-700 group-hover:scale-110",
                    compact ? "text-3xl" : "text-5xl",
                    categoryIcon(signal.category),
                  )}
                />
              </div>
            )}

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/5" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

            {/* shine sweep on hover */}
            <div className="pointer-events-none absolute inset-y-0 left-[-40%] w-1/3 rotate-12 bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-0 transition-all duration-700 ease-out group-hover:left-[130%] group-hover:opacity-100" />

            <div className={cn("absolute inset-x-0 top-0 flex items-start justify-between gap-2", compact ? "p-2" : "p-3")}>
              <span
                className={cn(
                  "inline-flex max-w-[75%] items-center gap-1.5 rounded-full border border-white/25 bg-white/15 backdrop-blur-md",
                  compact ? "py-0.5 pl-0.5 pr-2.5" : "py-1 pl-1 pr-3",
                )}
              >
                <span
                  className={cn(
                    "flex shrink-0 items-center justify-center rounded-full bg-white/25 text-white",
                    compact ? "h-4 w-4 text-[0.55rem]" : "h-5 w-5 text-[0.62rem]",
                  )}
                >
                  <i className={cn("bi", categoryIcon(signal.category))} />
                </span>
                <span className={cn("truncate font-semibold text-white", compact ? "text-[0.6rem]" : "text-[0.68rem]")}>
                  {signal.categoryLabel}
                </span>
              </span>

              <div className="flex shrink-0 flex-col items-end gap-1">
                {signal.isResolved && (
                  <span className="rounded-full border border-sky-200/40 bg-sky-500/90 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.06em] text-white shadow-sm">
                    Решен
                  </span>
                )}
                {!signal.isActive && !signal.isResolved && (
                  <span className="rounded-full border border-white/20 bg-black/45 px-2 py-0.5 text-[0.6rem] font-semibold text-white/90 backdrop-blur-md">
                    Неактивен
                  </span>
                )}
                {signal.isActive && signal.priorityTier ? (
                  <PriorityBadge tier={signal.priorityTier} size={compact ? "sm" : "md"} className="shadow-md" />
                ) : null}
              </div>
            </div>

            <div className={cn("absolute inset-x-0 bottom-0", compact ? "p-2 pt-6" : "p-3.5 pt-9")}>
              <h3
                className={cn(
                  "line-clamp-2 font-display font-bold leading-snug tracking-[-0.02em] !text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]",
                  compact ? "text-[0.82rem]" : "text-[1rem]",
                )}
              >
                {signal.title}
              </h3>
            </div>

            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-[3px] opacity-90"
              style={{ backgroundImage: `linear-gradient(90deg, ${accent}, #7bc47f, transparent 85%)` }}
            />
          </div>

          {/* ─── Body ─── */}
          <div className={cn("flex flex-1 flex-col", compact ? "gap-2 p-2.5" : "gap-3 p-4")}>
            {!compact &&
              (signal.description ? (
                <p className="line-clamp-2 text-[0.8rem] leading-relaxed text-[color:var(--color-text-secondary)]">
                  {signal.description}
                </p>
              ) : (
                <p className="text-[0.8rem] italic text-[color:var(--color-text-muted)]">Няма добавено описание.</p>
              ))}

            <div className="flex divide-x divide-black/[0.06] rounded-[14px] bg-[color:var(--color-surface-light)] shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]">
              <StatCoin
                icon={signal.hasBoosted ? "bi-arrow-up-circle-fill" : "bi-arrow-up-circle"}
                value={signal.priorityBoostCount}
                accent
                compact={compact}
              />
              <StatCoin icon="bi-eye" value={signal.viewsCount} compact={compact} />
              <StatCoin icon="bi-chat-left-text" value={signal.commentsCount} compact={compact} />
            </div>

            {signal.resolvedReportCount > 0 && !signal.isResolved && !compact ? (
              <p className="inline-flex items-center gap-1.5 rounded-[10px] border border-amber-200/60 bg-gradient-to-r from-amber-50 to-amber-50/40 px-2.5 py-1.5 text-[0.72rem] font-semibold text-amber-800">
                <i className="bi bi-flag-fill" />
                {signal.resolvedReportCount} доклада „решено“
              </p>
            ) : null}

            <div className={cn("mt-auto flex items-center gap-2 border-t border-black/[0.06]", compact ? "pt-2" : "pt-3")}>
              {signal.authorUsername ? (
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <div className={cn("shrink-0 rounded-full bg-gradient-to-br from-primary-300 to-primary-600 p-[1.5px]")}>
                    <div className="rounded-full bg-white p-[1.5px]">
                      <Avatar username={signal.authorUsername} imageUrl={signal.authorImageUrl} size={compact ? 22 : 30} />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "truncate font-semibold text-[color:var(--color-text-heading)]",
                        compact ? "text-[0.7rem]" : "text-[0.78rem]",
                      )}
                    >
                      {signal.authorUsername}
                    </p>
                    {!compact && (
                      <p className="text-[0.68rem] text-[color:var(--color-text-muted)]">
                        {formatRelativeDate(signal.createdAt)}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="flex-1 text-[0.72rem] text-[color:var(--color-text-muted)]">
                  <i className="bi bi-clock mr-1" />
                  {formatRelativeDate(signal.createdAt)}
                </p>
              )}

              <div className="flex shrink-0 flex-col items-end gap-0.5 text-[0.68rem] text-[color:var(--color-text-muted)]">
                {!compact && (
                  <span className="font-semibold tabular-nums text-[color:var(--color-text-muted)]/80">#{signal.id}</span>
                )}
                {signal.distanceKm != null && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-primary-50 to-primary-100/60 px-2 py-0.5 font-semibold text-primary">
                    <i className="bi bi-geo-alt" />
                    {signal.distanceKm < 1
                      ? `${Math.round(signal.distanceKm * 1000)} m`
                      : `${signal.distanceKm.toFixed(1)} km`}
                  </span>
                )}
                {signal.isResolved && signal.resolvedByUsername && (
                  <span className="max-w-[8rem] truncate text-right" title={signal.resolvedByUsername}>
                    от {signal.resolvedByUsername}
                  </span>
                )}
              </div>
            </div>
          </div>
        </article>
      </div>
    </button>
  );
}
