"use client";

import { Button } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useSetSignalResolved } from "../hooks/useSetSignalResolved";
import type { Signal } from "../types";

interface SignalAuthorResolveSectionProps {
  signal: Signal;
  className?: string;
}

/** Authors can mark their signals resolved / unresolved — not active/inactive. */
export function SignalAuthorResolveSection({ signal, className }: SignalAuthorResolveSectionProps) {
  const { mutate, isPending } = useSetSignalResolved();

  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-emerald-200/70 bg-gradient-to-br from-emerald-50/80 via-white to-white p-4 shadow-[0_4px_16px_rgba(16,185,129,0.08)]",
        className,
      )}
    >
      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-950">
        <i className="bi bi-check2-circle text-emerald-600" />
        Статус на решаване
      </h4>
      <p className="mb-3 text-xs leading-relaxed text-emerald-900/80">
        Като автор можете да отбележите дали проблемът е решен. Видимостта на сигнала на платформата се управлява от администратори.
      </p>
      <Button
        type="button"
        size="sm"
        variant={signal.isResolved ? "outline" : "primary"}
        disabled={isPending}
        onClick={() => mutate({ id: signal.id, markResolved: !signal.isResolved })}
        className="shadow-sm"
      >
        {isPending ? "Запазване…" : signal.isResolved ? "Маркирай като нерешен" : "Маркирай като решен"}
      </Button>
    </div>
  );
}
