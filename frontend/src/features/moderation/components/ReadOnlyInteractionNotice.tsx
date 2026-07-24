"use client";

import { cn } from "@/shared/lib/cn";

interface ReadOnlyInteractionNoticeProps {
  className?: string;
  /** Short context, e.g. "гласуване", "съобщения" */
  context?: string;
}

/** Inline notice when the account is in read-only (banned) mode. */
export function ReadOnlyInteractionNotice({ className, context }: ReadOnlyInteractionNoticeProps) {
  return (
    <p
      className={cn(
        "rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950",
        className,
      )}
      role="status"
    >
      <i className="bi bi-shield-exclamation mr-1.5" aria-hidden />
      Профилът е временно ограничен
      {context ? ` — ${context} не е налично` : ""}. Можете само да разглеждате съдържание.
    </p>
  );
}
