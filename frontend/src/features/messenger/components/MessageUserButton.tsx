"use client";

import { useRequireAuth } from "@/shared/hooks/useRequireAuth";
import { useToast } from "@/shared/hooks/useToast";
import { errorMessage } from "@/shared/lib/errorMessage";
import { cn } from "@/shared/lib/cn";
import { useStartConversation } from "../hooks/useStartConversation";

interface MessageUserButtonProps {
  userId: number;
  className?: string;
  label?: string;
}

/** Starts (or opens) a SVMessenger conversation with the given user. */
export function MessageUserButton({ userId, className, label = "Напиши" }: MessageUserButtonProps) {
  const requireAuth = useRequireAuth();
  const toast = useToast();
  const { mutate, isPending } = useStartConversation();

  async function handleClick() {
    if (!(await requireAuth("да изпратиш съобщение"))) return;
    mutate(userId, {
      onError: (error) => toast.error(errorMessage(error, "Разговорът не можа да се отвори.")),
    });
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={isPending}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-border-default/60 px-2.5 py-1.5 text-xs font-medium text-[color:var(--color-text-secondary)] transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50",
        className,
      )}
    >
      <i className="bi bi-chat-dots" />
      {label}
    </button>
  );
}
