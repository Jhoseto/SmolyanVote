"use client";

import { Avatar } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { formatRelativeDate } from "@/shared/lib/formatRelativeDate";
import { categoryIcon } from "../data/categories";
import { tierAccentColor } from "../lib/signalCardTheme";
import { PriorityBadge } from "./PriorityBadge";
import type { Signal } from "../types";

interface SignalListRowProps {
  signal: Signal;
  isSelected?: boolean;
  onSelect: () => void;
  compact?: boolean;
}

export function SignalListRow({ signal, isSelected, onSelect, compact }: SignalListRowProps) {
  const accent = tierAccentColor(signal.priorityTier);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-[var(--radius-lg)] border bg-white p-2.5 text-left transition-all active:scale-[0.99]",
        isSelected
          ? "border-primary/50 bg-primary-50/40 shadow-[0_4px_16px_rgba(25,134,28,0.12)]"
          : "border-border-default/30 shadow-[0_2px_8px_rgba(15,23,42,0.04)]",
        compact && "gap-2 p-2",
      )}
    >
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-[color:var(--color-surface-muted)]",
          compact ? "h-11 w-11" : "h-14 w-14",
        )}
      >
        {signal.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={signal.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-white"
            style={{ backgroundImage: `linear-gradient(135deg, ${accent}, #7bc47f)` }}
          >
            <i className={cn("bi text-lg", categoryIcon(signal.category))} />
          </div>
        )}
        {signal.isActive && signal.priorityTier ? (
          <span className="absolute -right-0.5 -top-0.5">
            <PriorityBadge tier={signal.priorityTier} size="sm" />
          </span>
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-sm font-semibold text-[color:var(--color-text-heading)]">{signal.title}</h3>
          {!compact ? (
            <i className="bi bi-chevron-right shrink-0 text-[color:var(--color-text-muted)]" aria-hidden />
          ) : null}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.72rem] text-[color:var(--color-text-muted)]">
          <span className="inline-flex items-center gap-1">
            <i className={cn("bi", categoryIcon(signal.category))} />
            {signal.categoryLabel}
          </span>
          <span>·</span>
          <span>{formatRelativeDate(signal.createdAt)}</span>
          {signal.distanceKm != null ? (
            <>
              <span>·</span>
              <span className="font-semibold text-primary">
                {signal.distanceKm < 1
                  ? `${Math.round(signal.distanceKm * 1000)} m`
                  : `${signal.distanceKm.toFixed(1)} km`}
              </span>
            </>
          ) : null}
        </div>
        {!compact ? (
          <div className="mt-1.5 flex items-center gap-3 text-[0.68rem] text-[color:var(--color-text-muted)]">
            <span className="inline-flex items-center gap-1">
              <i className="bi bi-arrow-up-circle" />
              {signal.priorityBoostCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <i className="bi bi-chat-left-text" />
              {signal.commentsCount}
            </span>
            {signal.authorUsername ? (
              <span className="inline-flex min-w-0 items-center gap-1">
                <Avatar username={signal.authorUsername} imageUrl={signal.authorImageUrl} size={16} />
                <span className="truncate">{signal.authorUsername}</span>
              </span>
            ) : null}
            {signal.isResolved ? (
              <span className="rounded-full bg-sky-100 px-1.5 py-0.5 font-semibold text-sky-700">Решен</span>
            ) : null}
          </div>
        ) : null}
      </div>
    </button>
  );
}
