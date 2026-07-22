"use client";

import { useRef, useState, type TouchEvent } from "react";
import { EmptyState, ErrorState, LogoLoader } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { formatRelativeDate } from "@/shared/lib/formatRelativeDate";
import { categoryIcon } from "../data/categories";
import { PriorityBadge } from "./PriorityBadge";
import type { Signal } from "../types";

interface SignalsListPanelProps {
  signals: Signal[];
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  onRefresh?: () => void;
  onSelect: (id: number) => void;
  selectedId?: number | null;
  className?: string;
}

function SignalCard({ signal, isSelected, onSelect }: { signal: Signal; isSelected: boolean; onSelect: () => void }) {
  const tierGlow =
    signal.priorityTier === "high"
      ? "hover:shadow-[0_8px_28px_rgba(239,68,68,0.12)]"
      : signal.priorityTier === "medium"
        ? "hover:shadow-[0_8px_28px_rgba(245,158,11,0.1)]"
        : "hover:shadow-[0_8px_28px_rgba(13,110,253,0.1)]";

  const tierAccent =
    signal.priorityTier === "high"
      ? "from-red-500/80 to-red-400/40"
      : signal.priorityTier === "medium"
        ? "from-amber-500/80 to-amber-400/40"
        : "from-primary/80 to-primary/30";

  return (
    <button type="button" onClick={onSelect} className="group block w-full text-left">
      <article
        className={cn(
          "relative flex gap-3 overflow-hidden rounded-[var(--radius-lg)] border bg-white p-3 transition-all duration-200",
          "border-border-default/40 shadow-[0_2px_8px_rgba(15,23,42,0.04)]",
          "hover:-translate-y-0.5 hover:border-primary/25",
          tierGlow,
          isSelected && "border-primary/40 bg-primary-50/50 shadow-[0_4px_20px_rgba(13,110,253,0.12)] ring-2 ring-primary/15",
        )}
      >
        <div className={cn("absolute inset-y-0 left-0 w-1 bg-gradient-to-b", tierAccent, !signal.isActive && "from-slate-400/60 to-slate-300/20")} />

        {signal.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={signal.imageUrl}
            alt=""
            className="ml-1 h-[72px] w-[72px] shrink-0 rounded-[var(--radius-md)] object-cover ring-1 ring-border-default/20"
          />
        ) : (
          <div className="ml-1 flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-gradient-to-br from-primary-50 to-white ring-1 ring-primary/10">
            <i className={cn("bi text-2xl text-primary/70", categoryIcon(signal.category))} />
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-1.5 py-0.5">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-2 text-sm font-semibold leading-snug text-[color:var(--color-text-primary)] group-hover:text-primary">
              {signal.title}
            </p>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {signal.isResolved && (
                <span className="rounded-[var(--radius-pill)] bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 ring-1 ring-blue-200/50">
                  Решен
                </span>
              )}
              {!signal.isActive && !signal.isResolved && (
                <span className="rounded-[var(--radius-pill)] bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                  Изтекъл
                </span>
              )}
              {signal.isActive && signal.priorityTier ? <PriorityBadge tier={signal.priorityTier} /> : null}
            </div>
          </div>

          <p className="flex items-center gap-1.5 text-xs text-[color:var(--color-text-muted)]">
            <i className={cn("bi text-primary/70", categoryIcon(signal.category))} />
            {signal.categoryLabel}
          </p>

          <div className="mt-auto flex items-center gap-3 text-[11px] font-medium text-[color:var(--color-text-muted)]">
            <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--color-surface-muted)] px-2 py-0.5">
              <i className="bi bi-arrow-up-circle text-primary/80" />
              {signal.priorityBoostCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <i className="bi bi-eye" />
              {signal.viewsCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <i className="bi bi-chat" />
              {signal.commentsCount}
            </span>
            <span className="ml-auto text-[10px]">{formatRelativeDate(signal.createdAt)}</span>
          </div>
        </div>
      </article>
    </button>
  );
}

export function SignalsListPanel({ signals, isPending, isError, onRetry, onRefresh, onSelect, selectedId, className }: SignalsListPanelProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef<number | null>(null);

  function handleTouchStart(e: TouchEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (el.scrollTop > 0 || !onRefresh) return;
    touchStartY.current = e.touches[0]?.clientY ?? null;
  }

  function handleTouchMove(e: TouchEvent<HTMLDivElement>) {
    const start = touchStartY.current;
    if (start == null) return;
    const delta = (e.touches[0]?.clientY ?? start) - start;
    if (delta > 0) setPullDistance(Math.min(delta, 80));
  }

  async function handleTouchEnd() {
    if (pullDistance >= 56 && onRefresh && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    touchStartY.current = null;
    setPullDistance(0);
  }

  return (
    <div
      className={cn(
        "relative flex flex-col gap-2.5 overflow-y-auto rounded-[var(--radius-lg)] border border-border-default/30 bg-gradient-to-b from-[color:var(--color-surface-light)]/50 to-white p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
        className,
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {pullDistance > 0 || isRefreshing ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center py-2 text-xs font-medium text-primary"
          style={{ transform: `translateY(${Math.max(0, pullDistance - 24)}px)` }}
        >
          {isRefreshing ? "Опресняване…" : pullDistance >= 56 ? "Пусни за опресняване" : "Дръпни за опресняване"}
        </div>
      ) : null}
      {isPending && (
        <div className="flex justify-center py-10">
          <LogoLoader size="md" label="Зареждане на сигнали…" />
        </div>
      )}

      {isError && <ErrorState description="Сигналите не можаха да се заредят." onRetry={onRetry} />}

      {!isPending && !isError && signals.length === 0 && (
        <EmptyState
          icon="bi-megaphone"
          title="Няма сигнали"
          description="Няма сигнали, отговарящи на филтрите. Опитай да промениш критериите или подай нов сигнал."
        />
      )}

      {signals.map((signal) => (
        <SignalCard key={signal.id} signal={signal} isSelected={signal.id === selectedId} onSelect={() => onSelect(signal.id)} />
      ))}
    </div>
  );
}
