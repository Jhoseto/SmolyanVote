"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/shared/lib/cn";

interface HoverCardProps {
  children: ReactNode;
  content: ReactNode;
  /** Delay before opening (ms). Default 1000. */
  openDelay?: number;
  /** Delay before closing after leave (ms). Default 280. */
  closeDelay?: number;
  className?: string;
  contentClassName?: string;
  /** Called when the card becomes open (after delay). */
  onOpenChange?: (open: boolean) => void;
}

function canHoverFine(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

/**
 * Facebook-style hover balloon: opens after a delay, stays open while
 * pointer is over the trigger or the card. Desktop / fine-pointer only.
 */
export function HoverCard({
  children,
  content,
  openDelay = 1000,
  closeDelay = 280,
  className,
  contentClassName,
  onOpenChange,
}: HoverCardProps) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const [enabled, setEnabled] = useState(false);
  const panelId = useId();

  useEffect(() => {
    setEnabled(canHoverFine());
  }, []);

  const clearTimers = useCallback(() => {
    if (openTimer.current != null) window.clearTimeout(openTimer.current);
    if (closeTimer.current != null) window.clearTimeout(closeTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
  }, []);

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = 320;
    const gap = 8;
    let left = rect.left;
    if (left + width > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - width - 12);
    }
    let top = rect.bottom + gap;
    const estimatedHeight = 220;
    if (top + estimatedHeight > window.innerHeight - 12) {
      top = Math.max(12, rect.top - estimatedHeight - gap);
    }
    setCoords({ top, left });
  }, []);

  const show = useCallback(() => {
    updatePosition();
    setOpen(true);
    onOpenChange?.(true);
  }, [onOpenChange, updatePosition]);

  const hide = useCallback(() => {
    setOpen(false);
    onOpenChange?.(false);
  }, [onOpenChange]);

  function scheduleOpen() {
    if (!enabled) return;
    clearTimers();
    openTimer.current = window.setTimeout(show, openDelay);
  }

  function scheduleClose() {
    if (!enabled) return;
    clearTimers();
    closeTimer.current = window.setTimeout(hide, closeDelay);
  }

  function cancelClose() {
    if (closeTimer.current != null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  useEffect(() => () => clearTimers(), [clearTimers]);

  useEffect(() => {
    if (!open) return;
    function onScrollOrResize() {
      updatePosition();
    }
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, updatePosition]);

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <>
      <span
        ref={triggerRef}
        className={cn("inline-flex max-w-full min-w-0", className)}
        onMouseEnter={scheduleOpen}
        onMouseLeave={scheduleClose}
        aria-describedby={open ? panelId : undefined}
      >
        {children}
      </span>
      {open && coords && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={cardRef}
              id={panelId}
              role="dialog"
              className={cn(
                "fixed z-[1080] w-[min(320px,calc(100vw-24px))] overflow-hidden rounded-[var(--radius-lg)] border border-border-default/50 bg-white shadow-[var(--shadow-dropdown)]",
                contentClassName,
              )}
              style={{ top: coords.top, left: coords.left }}
              onMouseEnter={cancelClose}
              onMouseLeave={scheduleClose}
            >
              {content}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
