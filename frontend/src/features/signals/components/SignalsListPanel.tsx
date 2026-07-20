"use client";

import { Card, EmptyState, ErrorState, LogoLoader } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { formatRelativeDate } from "@/shared/lib/formatRelativeDate";
import { categoryIcon } from "../data/categories";
import type { Signal } from "../types";

interface SignalsListPanelProps {
  signals: Signal[];
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  onSelect: (id: number) => void;
  selectedId?: number | null;
  className?: string;
}

function SignalCard({ signal, isSelected, onSelect }: { signal: Signal; isSelected: boolean; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} className="block w-full text-left">
      <Card
        className={cn(
          "flex gap-3 p-3 transition-colors hover:border-primary/50",
          isSelected && "border-primary bg-primary-50",
        )}
      >
        {signal.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary thumbnail
          <img src={signal.imageUrl} alt="" className="h-16 w-16 shrink-0 rounded-[var(--radius-md)] object-cover" />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-surface-muted)]">
            <i className={cn("bi text-xl text-[color:var(--color-text-muted)]", categoryIcon(signal.category))} />
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-2 text-sm font-semibold text-[color:var(--color-text-primary)]">{signal.title}</p>
            {!signal.isActive && (
              <span className="shrink-0 rounded-[var(--radius-pill)] bg-[color:var(--color-surface-muted)] px-2 py-0.5 text-[10px] font-medium text-[color:var(--color-text-muted)]">
                Изтекъл
              </span>
            )}
          </div>
          <p className="flex items-center gap-1.5 text-xs text-[color:var(--color-text-muted)]">
            <i className={cn("bi", categoryIcon(signal.category))} />
            {signal.categoryLabel}
          </p>
          <div className="mt-auto flex items-center gap-3 text-xs text-[color:var(--color-text-muted)]">
            <span className="flex items-center gap-1">
              <i className="bi bi-hand-thumbs-up" />
              {signal.likesCount}
            </span>
            <span className="flex items-center gap-1">
              <i className="bi bi-eye" />
              {signal.viewsCount}
            </span>
            <span className="flex items-center gap-1">
              <i className="bi bi-chat" />
              {signal.commentsCount}
            </span>
            <span className="ml-auto">{formatRelativeDate(signal.createdAt)}</span>
          </div>
        </div>
      </Card>
    </button>
  );
}

/** Desktop + mobile cards panel (MODERN_FRONTEND_PLAN §Signals list panel) — shares the same filtered query as the map. */
export function SignalsListPanel({ signals, isPending, isError, onRetry, onSelect, selectedId, className }: SignalsListPanelProps) {
  return (
    <div className={cn("flex flex-col gap-2.5 overflow-y-auto", className)}>
      {isPending && (
        <div className="flex justify-center py-10">
          <LogoLoader size="md" label="Зареждане на сигнали…" />
        </div>
      )}

      {isError && <ErrorState description="Сигналите не можаха да се заредят." onRetry={onRetry} />}

      {!isPending && !isError && signals.length === 0 && (
        <EmptyState icon="bi-megaphone" title="Няма сигнали" description="Няма сигнали, отговарящи на филтрите." />
      )}

      {signals.map((signal) => (
        <SignalCard key={signal.id} signal={signal} isSelected={signal.id === selectedId} onSelect={() => onSelect(signal.id)} />
      ))}
    </div>
  );
}
