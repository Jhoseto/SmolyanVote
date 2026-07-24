"use client";

import { EmptyState, ErrorState, LogoLoader, Skeleton } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { SignalCard } from "./SignalCard";
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

const GRID_CLASSES =
  "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5";

export function SignalsListPanel({
  signals,
  isPending,
  isError,
  onRetry,
  onRefresh,
  onSelect,
  selectedId,
  className,
}: SignalsListPanelProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-base font-bold text-[color:var(--color-text-heading)]">
          <i className="bi bi-grid-3x3-gap-fill text-primary" />
          Всички сигнали
          {!isPending && !isError ? (
            <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary">
              {signals.length}
            </span>
          ) : null}
        </h2>
        {onRefresh ? (
          <button
            type="button"
            onClick={() => onRefresh()}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-border-default/40 bg-white px-3 py-1.5 text-xs font-semibold text-[color:var(--color-text-secondary)] shadow-sm transition-colors hover:border-primary/30 hover:bg-primary-50 hover:text-primary"
          >
            <i className="bi bi-arrow-clockwise" />
            Обнови
          </button>
        ) : null}
      </div>

      {isPending && (
        <div className={GRID_CLASSES}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[15.5rem] w-full rounded-[18px]" />
          ))}
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

      {!isPending && !isError && signals.length > 0 && (
        <div className={GRID_CLASSES}>
          {signals.map((signal) => (
            <SignalCard
              key={signal.id}
              signal={signal}
              isSelected={signal.id === selectedId}
              onSelect={() => onSelect(signal.id)}
              compact
            />
          ))}
        </div>
      )}
    </div>
  );
}
