"use client";

import { cn } from "@/shared/lib/cn";
import { useRequireAuth } from "@/shared/hooks/useRequireAuth";
import { useToast } from "@/shared/hooks/useToast";
import { errorMessage } from "@/shared/lib/errorMessage";
import { useSignalSubscribe } from "../hooks/useSignalSubscribe";
import type { Signal } from "../types";

interface SignalSubscribeButtonProps {
  signal: Signal;
  className?: string;
}

export function SignalSubscribeButton({ signal, className }: SignalSubscribeButtonProps) {
  const requireAuth = useRequireAuth();
  const toast = useToast();
  const { mutate, isPending } = useSignalSubscribe();

  async function toggle() {
    if (!(await requireAuth("да абонираш за обновления по сигнал"))) return;
    mutate(
      { id: signal.id, subscribe: !signal.isSubscribed },
      {
        onSuccess: (updated) =>
          toast.success(updated.isSubscribed ? "Абониран сте за обновления." : "Абонаментът е премахнат."),
        onError: (err) => toast.error(errorMessage(err, "Не успяхме да променим абонамента.")),
      },
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      className={cn(
        "inline-flex items-center gap-2 rounded-[var(--radius-pill)] border px-3.5 py-2 text-xs font-semibold shadow-sm transition-colors disabled:opacity-50",
        signal.isSubscribed
          ? "border-primary/30 bg-primary-50 text-primary"
          : "border-border-default/40 bg-white text-[color:var(--color-text-secondary)] hover:border-primary/30 hover:bg-primary-50 hover:text-primary",
        className,
      )}
    >
      <i className={cn("bi", signal.isSubscribed ? "bi-bell-fill" : "bi-bell")} />
      {signal.isSubscribed ? "Абониран" : "Абонирай се"}
    </button>
  );
}
