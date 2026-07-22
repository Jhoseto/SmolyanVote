"use client";

import { formatRelativeDate } from "@/shared/lib/formatRelativeDate";
import { cn } from "@/shared/lib/cn";
import type { Signal } from "../types";

interface SignalTimelineProps {
  signal: Signal;
}

export function SignalTimeline({ signal }: SignalTimelineProps) {
  const events = [
    { icon: "bi-plus-circle-fill", tone: "text-primary", label: "Подаден", at: signal.createdAt },
    ...(signal.modifiedAt !== signal.createdAt
      ? [{ icon: "bi-pencil-fill", tone: "text-amber-600", label: "Редактиран", at: signal.modifiedAt }]
      : []),
    ...(signal.isResolved
      ? [
          {
            icon: "bi-check-circle-fill",
            tone: "text-blue-600",
            label: signal.resolvedByUsername ? `Решен от ${signal.resolvedByUsername}` : "Решен",
            at: signal.modifiedAt,
          },
        ]
      : []),
  ];

  return (
    <div className="rounded-[var(--radius-lg)] border border-border-default/25 bg-[color:var(--color-surface-light)]/50 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text-muted)]">Хронология</p>
      <ol className="flex flex-col gap-3">
        {events.map((ev) => (
          <li key={ev.label} className="flex items-start gap-3">
            <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-border-default/30 ${ev.tone}`}>
              <i className={cn("bi text-sm", ev.icon)} />
            </span>
            <div>
              <p className="text-sm font-medium text-[color:var(--color-text-primary)]">{ev.label}</p>
              <p className="text-xs text-[color:var(--color-text-muted)]">{formatRelativeDate(ev.at)}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
