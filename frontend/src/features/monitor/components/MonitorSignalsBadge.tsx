"use client";

import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import type { MonitorRelatedSignal } from "../types";

interface MonitorSignalsBadgeProps {
  count: number;
  contractId?: number;
  signals?: MonitorRelatedSignal[];
  className?: string;
}

export function MonitorSignalsBadge({
  count,
  contractId,
  signals,
  className,
}: MonitorSignalsBadgeProps) {
  if (count <= 0) return null;

  const label =
    count === 1 ? "1 свързан сигнал" : `${count} свързани сигнала`;

  return (
    <div className={cn("space-y-2", className)}>
      <Link
        href={contractId ? `/signals?search=${encodeURIComponent(signals?.[0]?.title ?? "")}` : "/signals"}
        className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-[0.68rem] font-semibold text-orange-800 ring-1 ring-orange-200/80 transition hover:bg-orange-100"
      >
        <i className="bi bi-geo-alt" />
        {label}
      </Link>
      {signals && signals.length > 0 && (
        <ul className="space-y-1.5">
          {signals.slice(0, 3).map((signal) => (
            <li key={signal.id}>
              <Link
                href={`/signals?focus=${signal.id}`}
                className="block rounded-[var(--radius-md)] border border-border-default/30 bg-white/90 px-3 py-2 text-[0.78rem] transition hover:border-primary/25"
              >
                <span className="font-medium text-[color:var(--color-text-heading)]">{signal.title}</span>
                {signal.snippet && (
                  <p className="mt-0.5 line-clamp-1 text-[color:var(--color-text-muted)]">{signal.snippet}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
