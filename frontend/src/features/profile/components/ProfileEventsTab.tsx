"use client";

import { useMemo, useState } from "react";
import { EmptyState, ErrorState, Skeleton } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useProfileEvents } from "../hooks/useProfileEvents";
import { ProfileEventCard } from "./ProfileEventCard";
import type { ProfileEventFilter } from "../types";

const FILTERS: { value: ProfileEventFilter; label: string }[] = [
  { value: "all", label: "Всички" },
  { value: "SIMPLEEVENT", label: "Събития" },
  { value: "REFERENDUM", label: "Референдуми" },
  { value: "MULTI_POLL", label: "Анкети" },
];

/** Client-side type filter — legacy `.filter-btn[data-filter]` port (whole tab already fetched in one request). */
export function ProfileEventsTab({ username }: { username: string }) {
  const { data, isPending, isError, refetch } = useProfileEvents(username);
  const [filter, setFilter] = useState<ProfileEventFilter>("all");

  const filtered = useMemo(
    () => (filter === "all" ? data ?? [] : (data ?? []).filter((e) => e.eventType === filter)),
    [data, filter],
  );

  if (isPending) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-56 w-full rounded-[var(--radius-lg)]" />
        ))}
      </div>
    );
  }

  if (isError) return <ErrorState description="Събитията не можаха да се заредят." onRetry={() => refetch()} />;

  if (!data?.length) return <EmptyState icon="bi-calendar-event" title="Няма създадени събития" />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-[var(--radius-pill)] px-3 py-1.5 text-sm font-medium transition-colors",
              filter === f.value
                ? "bg-primary text-white"
                : "bg-[color:var(--color-surface-muted)] text-[color:var(--color-text-secondary)] hover:bg-primary-50",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="bi-funnel" title="Няма събития от този тип" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event) => (
            <ProfileEventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
