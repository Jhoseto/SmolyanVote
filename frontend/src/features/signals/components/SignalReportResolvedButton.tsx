"use client";

import { cn } from "@/shared/lib/cn";
import { useRequireAuth } from "@/shared/hooks/useRequireAuth";
import { useCanInteract } from "@/features/moderation/hooks/useCanInteract";
import { useToast } from "@/shared/hooks/useToast";
import { errorMessage } from "@/shared/lib/errorMessage";
import { useReportSignalResolved } from "../hooks/useReportSignalResolved";
import type { Signal } from "../types";

interface SignalReportResolvedButtonProps {
  signal: Signal;
  className?: string;
}

export function SignalReportResolvedButton({ signal, className }: SignalReportResolvedButtonProps) {
  const requireAuth = useRequireAuth();
  const canInteract = useCanInteract();
  const toast = useToast();
  const { mutate, isPending } = useReportSignalResolved();

  if (signal.isResolved) return null;

  async function handleReport() {
    if (!(await requireAuth("да докладваш сигнал като решен"))) return;
    mutate(signal.id, {
      onSuccess: (updated) => {
        toast.success("Благодарим! Докладът е записан.");
        if (updated.resolvedReportCount >= 2) {
          toast.info("Достатъчно потребители докладваха — администраторите са уведомени.");
        }
      },
      onError: (err) => toast.error(errorMessage(err, "Не успяхме да запишем доклада.")),
    });
  }

  return (
    <button
      type="button"
      onClick={handleReport}
      disabled={isPending || signal.hasReportedResolved || !canInteract}
      className={cn(
        "inline-flex items-center gap-2 rounded-[var(--radius-pill)] border px-3.5 py-2 text-xs font-semibold shadow-sm transition-colors disabled:opacity-50",
        signal.hasReportedResolved
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-border-default/40 bg-white text-[color:var(--color-text-secondary)] hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700",
        className,
      )}
    >
      <i className={cn("bi", signal.hasReportedResolved ? "bi-check-circle-fill" : "bi-check-circle")} />
      {signal.hasReportedResolved ? "Докладван като решен" : "Докладвай като решен"}
      {signal.resolvedReportCount > 0 ? (
        <span className="rounded-full bg-[color:var(--color-surface-muted)] px-1.5 py-0.5 text-[10px] tabular-nums">
          {signal.resolvedReportCount}
        </span>
      ) : null}
    </button>
  );
}
