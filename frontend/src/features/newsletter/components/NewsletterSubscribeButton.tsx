"use client";

import { useNewsletterSubscribe } from "../hooks/useNewsletterSubscribe";
import { cn } from "@/shared/lib/cn";

interface NewsletterSubscribeButtonProps {
  className?: string;
  title?: string;
  hint?: string;
  subscribeLabel?: string;
  subscribedLabel?: string;
  pendingLabel?: string;
}

/** Compact footer newsletter CTA. */
export function NewsletterSubscribeButton({
  className,
  title = "Бюлетин",
  hint = "Нови събития и важни обновления",
  subscribeLabel = "Абонирай се",
  subscribedLabel = "Абониран си",
  pendingLabel = "Абониране...",
}: NewsletterSubscribeButtonProps) {
  const { subscribe, isPending, isSuccess } = useNewsletterSubscribe();

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
        className,
      )}
    >
      <div className="min-w-0 flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <i className="bi bi-envelope-plus text-sm" />
        </span>
        <p className="truncate text-sm text-[color:var(--color-text-secondary)]">
          <span className="font-semibold text-[color:var(--color-text-heading)]">{title}</span>
          <span className="mx-1.5 text-[color:var(--color-text-muted)]">·</span>
          <span>{hint}</span>
        </p>
      </div>
      <button
        type="button"
        onClick={subscribe}
        disabled={isPending || isSuccess}
        className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-[var(--radius-pill)] bg-[image:var(--gradient-primary)] px-4 text-xs font-semibold text-white shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        <i className={`bi ${isSuccess ? "bi-check-lg" : "bi-envelope-plus"}`} />
        {isSuccess ? subscribedLabel : isPending ? pendingLabel : subscribeLabel}
      </button>
    </div>
  );
}
