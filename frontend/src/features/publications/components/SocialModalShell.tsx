"use client";

import type { ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { cn } from "@/shared/lib/cn";

interface SocialModalShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  bodyClassName?: string;
  /**
   * `auto` — body scrolls as one pane (default).
   * `hidden` — body is a fixed viewport; children own their scroll (split panes).
   */
  bodyScroll?: "auto" | "hidden";
  footer?: ReactNode;
  /** Stack above another social modal (e.g. reactions over detail). */
  elevated?: boolean;
}

const SIZE_CLASS = {
  sm: "max-w-[400px]",
  md: "max-w-[480px]",
  lg: "max-w-[720px]",
  xl: "max-w-[1120px]",
} as const;

/** Shared glass social dialog — detail, reactions, comments. */
export function SocialModalShell({
  open,
  onClose,
  title,
  children,
  size = "lg",
  className,
  bodyClassName,
  bodyScroll = "auto",
  footer,
  elevated = false,
}: SocialModalShellProps) {
  const zBackdrop = elevated ? "z-[1100]" : "z-[1090]";
  const zPopup = elevated ? "z-[1101]" : "z-[1091]";

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            "fixed inset-0 bg-black/45 backdrop-blur-md transition-opacity data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
            zBackdrop,
          )}
        />
        <Dialog.Popup
          className={cn(
            "fixed inset-0 flex items-start justify-center overflow-y-auto p-3 outline-none sm:items-center sm:p-4",
            zPopup,
          )}
        >
          <div
            className={cn(
              "my-4 flex w-full flex-col overflow-hidden rounded-[var(--radius-xl)] border border-white/50 bg-white/97 shadow-[var(--shadow-dropdown)] backdrop-blur-md transition-all data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0 data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 sm:my-8",
              // Split panes need a definite height so child `overflow-y-auto` can scroll.
              bodyScroll === "hidden"
                ? "h-[min(92vh,900px)] max-h-[min(92vh,900px)]"
                : "max-h-[min(92vh,900px)]",
              SIZE_CLASS[size],
              className,
            )}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-border-default/50 px-4 py-3.5 sm:px-5">
              <Dialog.Title className="font-display text-base font-semibold tracking-[-0.01em] text-[color:var(--color-text-heading)]">
                {title}
              </Dialog.Title>
              <Dialog.Close
                aria-label="Затвори"
                className="flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--color-text-muted)] transition-colors hover:bg-[color:var(--color-surface-muted)] hover:text-[color:var(--color-text-primary)]"
              >
                <i className="bi bi-x-lg" />
              </Dialog.Close>
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
