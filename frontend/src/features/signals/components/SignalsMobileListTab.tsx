"use client";

import { useEffect, useState } from "react";
import { EmptyState, ErrorState, Skeleton } from "@/shared/ui";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useSignalsFilters } from "../hooks/useSignalsFilters";
import { SignalsLanesSection } from "./SignalsLanesSection";
import { SignalListRow } from "./SignalListRow";
import type { Signal } from "../types";

interface SignalsMobileListTabProps {
  signals: Signal[];
  isPending: boolean;
  isError: boolean;
  selectedId?: number | null;
  onSelect: (id: number) => void;
  onRetry: () => void;
}

export function SignalsMobileListTab({
  signals,
  isPending,
  isError,
  selectedId,
  onSelect,
  onRetry,
}: SignalsMobileListTabProps) {
  const [filters, setFilters] = useSignalsFilters();
  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput, 300);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setFilters({ search: debouncedSearch || null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  return (
    <div className="signals-mobile-list-pane">
      <div className="shrink-0 border-b border-border-default/15 bg-white/95 px-3 py-2 backdrop-blur-md">
        <div className="relative">
          <i className="bi bi-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-text-muted)]" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Търси по заглавие, описание, автор…"
            className="h-10 w-full rounded-[var(--radius-lg)] border border-border-default/30 bg-[color:var(--color-surface-light)]/70 pl-9 pr-3 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-[calc(var(--signals-mobile-fab-offset)+4.5rem)]">
        {!isPending && !isError && signals.length > 0 ? (
          <div className="border-b border-border-default/10 px-3 py-3">
            <SignalsLanesSection signals={signals} onSelect={onSelect} selectedId={selectedId} />
          </div>
        ) : null}

        <div className="px-3 py-3">
          {isPending ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-[4.5rem] w-full rounded-[var(--radius-lg)]" />
              ))}
            </div>
          ) : null}

          {isError ? <ErrorState description="Сигналите не можаха да се заредят." onRetry={onRetry} /> : null}

          {!isPending && !isError && signals.length === 0 ? (
            <EmptyState
              icon="bi-megaphone"
              title="Няма сигнали"
              description="Промени филтрите или подай нов сигнал."
            />
          ) : null}

          {!isPending && !isError && signals.length > 0 ? (
            <div className="flex flex-col gap-2">
              <h2 className="flex items-center gap-2 px-0.5 text-sm font-bold text-[color:var(--color-text-heading)]">
                <i className="bi bi-list-ul text-primary" />
                Всички сигнали
                <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary">{signals.length}</span>
              </h2>
              {signals.map((signal) => (
                <SignalListRow
                  key={signal.id}
                  signal={signal}
                  isSelected={signal.id === selectedId}
                  onSelect={() => onSelect(signal.id)}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
