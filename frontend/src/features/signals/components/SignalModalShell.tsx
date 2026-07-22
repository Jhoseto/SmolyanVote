"use client";

import type { ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { cn } from "@/shared/lib/cn";

interface SignalModalShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  icon?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  headerExtra?: ReactNode;
  maxWidth?: "md" | "lg";
  /** `sheet` — bottom sheet on mobile; `social` — centered split-pane like publications. */
  variant?: "sheet" | "social";
  size?: "md" | "lg" | "xl";
  bodyScroll?: "auto" | "hidden";
  bodyClassName?: string;
}

const SHEET_MAX_WIDTH = {
  md: "sm:max-w-[640px]",
  lg: "sm:max-w-[720px]",
} as const;

const SOCIAL_SIZE = {
  md: "max-w-[480px]",
  lg: "max-w-[720px]",
  xl: "max-w-[1120px]",
} as const;

/** Premium dialog shell — bottom sheet (create/edit) or social split-pane (detail). */
export function SignalModalShell({
  open,
  onOpenChange,
  title,
  icon = "bi-megaphone-fill",
  subtitle,
  children,
  footer,
  headerExtra,
  maxWidth = "md",
  variant = "sheet",
  size = "lg",
  bodyScroll = "auto",
  bodyClassName,
}: SignalModalShellProps) {
  if (variant === "social") {
    return (
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-[1090] bg-black/45 backdrop-blur-md transition-opacity data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
          <Dialog.Popup className="fixed inset-0 z-[1091] flex items-start justify-center overflow-y-auto p-3 outline-none sm:items-center sm:p-4">
            <div
              className={cn(
                "my-4 flex w-full flex-col overflow-hidden rounded-[var(--radius-xl)] border border-white/50 bg-white/97 shadow-[var(--shadow-dropdown)] backdrop-blur-md transition-all data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0 data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 sm:my-8",
                bodyScroll === "hidden"
                  ? "h-[min(92vh,900px)] max-h-[min(92vh,900px)]"
                  : "max-h-[min(92vh,900px)]",
                SOCIAL_SIZE[size],
              )}
            >
              <div className="relative shrink-0 overflow-hidden border-b border-border-default/50">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary-50/90 via-white to-emerald-50/40" />
                <div className="relative flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] text-white shadow-[0_4px_14px_rgba(13,110,253,0.35)]">
                      <i className={cn("bi text-base", icon)} />
                    </span>
                    <div className="min-w-0">
                      <Dialog.Title className="truncate font-display text-base font-semibold tracking-[-0.01em] text-[color:var(--color-text-heading)]">
                        {title}
                      </Dialog.Title>
                      {subtitle ? (
                        <p className="truncate text-xs text-[color:var(--color-text-muted)]">{subtitle}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {headerExtra}
                    <Dialog.Close
                      aria-label="Затвори"
                      className="flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--color-text-muted)] transition-colors hover:bg-[color:var(--color-surface-muted)] hover:text-[color:var(--color-text-primary)]"
                    >
                      <i className="bi bi-x-lg" />
                    </Dialog.Close>
                  </div>
                </div>
              </div>
              <div
                className={cn(
                  "min-h-0 flex-1",
                  bodyScroll === "hidden" ? "h-0 overflow-hidden" : "overflow-y-auto",
                  bodyClassName,
                )}
              >
                {children}
              </div>
              {footer ? (
                <div className="shrink-0 border-t border-border-default/50 bg-white/90 px-4 py-3 backdrop-blur-sm sm:px-5">
                  {footer}
                </div>
              ) : null}
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[1090] bg-slate-900/55 backdrop-blur-md transition-opacity data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <Dialog.Popup
          className={cn(
            "fixed inset-x-0 bottom-0 z-[1091] flex w-full max-h-[92dvh] flex-col overflow-hidden outline-none",
            "rounded-t-[var(--radius-xl)] border border-white/60 bg-white/98 shadow-[0_24px_80px_rgba(15,23,42,0.22)] backdrop-blur-xl",
            "transition-all data-[starting-style]:translate-y-4 data-[starting-style]:opacity-0 data-[ending-style]:translate-y-4 data-[ending-style]:opacity-0",
            "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[min(90vh,860px)] sm:w-[calc(100%-2rem)]",
            "sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[var(--radius-xl)]",
            "sm:data-[starting-style]:translate-y-[calc(-50%+12px)] sm:data-[starting-style]:-translate-x-1/2 sm:data-[starting-style]:opacity-0",
            SHEET_MAX_WIDTH[maxWidth],
          )}
        >
          <div className="h-1 shrink-0 bg-[image:var(--gradient-primary)] sm:rounded-t-[var(--radius-xl)]" aria-hidden />

          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border-default/70 sm:hidden" aria-hidden />

          <div className="flex shrink-0 items-center justify-between border-b border-border-default/40 bg-gradient-to-r from-primary-50/70 via-white to-white px-4 py-3.5 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] text-white shadow-[0_4px_14px_rgba(13,110,253,0.35)]">
                <i className={cn("bi text-base", icon)} />
              </span>
              <div className="min-w-0">
                <Dialog.Title className="truncate font-display text-base font-semibold tracking-[-0.01em] text-[color:var(--color-text-heading)]">
                  {title}
                </Dialog.Title>
                {subtitle ? (
                  <p className="truncate text-xs text-[color:var(--color-text-muted)]">{subtitle}</p>
                ) : null}
              </div>
            </div>
            <Dialog.Close
              aria-label="Затвори"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[color:var(--color-text-muted)] transition-colors hover:bg-[color:var(--color-surface-muted)] hover:text-[color:var(--color-text-primary)]"
            >
              <i className="bi bi-x-lg" />
            </Dialog.Close>
          </div>

          <div className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain", bodyClassName)}>{children}</div>

          {footer ? (
            <div className="shrink-0 border-t border-border-default/40 bg-white/90 px-4 py-3 backdrop-blur-md sm:px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              {footer}
            </div>
          ) : null}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export const signalFieldClass =
  "w-full rounded-[var(--radius-md)] border border-border-default/50 bg-white px-3.5 py-2.5 text-sm shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15";

export function SignalFieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-[11px] font-bold uppercase tracking-[0.06em] text-[color:var(--color-text-muted)]"
    >
      {children}
    </label>
  );
}

export function SignalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5 rounded-[var(--radius-lg)] border border-border-default/30 bg-gradient-to-b from-[color:var(--color-surface-light)]/80 to-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
      <h3 className="flex items-center gap-2 text-xs font-semibold text-[color:var(--color-text-heading)]">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        {title}
      </h3>
      {children}
    </section>
  );
}
