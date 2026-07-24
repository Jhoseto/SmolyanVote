"use client";

import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

type ToastVariant = "success" | "error" | "warning" | "info" | "default";

const ICONS: Record<ToastVariant, string> = {
  success: "bi-check2",
  error: "bi-x-lg",
  warning: "bi-exclamation-lg",
  info: "bi-info-lg",
  default: "bi-bell",
};

const ICON_STYLES: Record<ToastVariant, string> = {
  success:
    "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-[0_8px_20px_-6px_rgba(34,197,94,0.55)] ring-1 ring-emerald-300/40",
  error:
    "bg-gradient-to-br from-rose-400 to-red-600 text-white shadow-[0_8px_20px_-6px_rgba(239,68,68,0.55)] ring-1 ring-red-300/40",
  warning:
    "bg-gradient-to-br from-amber-300 to-orange-500 text-white shadow-[0_8px_20px_-6px_rgba(245,158,11,0.55)] ring-1 ring-amber-200/50",
  info: "bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-[0_8px_20px_-6px_rgba(59,130,246,0.55)] ring-1 ring-sky-300/40",
  default:
    "bg-[image:var(--gradient-primary)] text-white shadow-[0_8px_20px_-6px_rgba(25,134,28,0.45)] ring-1 ring-primary-300/40",
};

export function ToastIcon({ variant }: { variant: ToastVariant }): ReactNode {
  return (
    <span
      className={cn(
        "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px]",
        ICON_STYLES[variant],
      )}
      aria-hidden
    >
      <span className="pointer-events-none absolute inset-0 rounded-[14px] bg-white/20" />
      <i className={cn("bi relative text-[1.05rem] leading-none", ICONS[variant])} />
    </span>
  );
}

export const toastClassNames = {
  toast:
    "sv-toast group !gap-3.5 !rounded-[var(--radius-xl)] !border !border-white/70 !p-[1rem_1rem_1.05rem_1rem] !font-[var(--font-body)] !shadow-[0_22px_50px_-18px_rgba(15,23,42,0.28),0_0_0_1px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.85)] !backdrop-blur-2xl !backdrop-saturate-150 !transition-[transform,box-shadow] !duration-300 hover:!-translate-y-0.5 hover:!shadow-[0_28px_60px_-20px_rgba(15,23,42,0.32),0_0_0_1px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.9)]",
  title:
    "!font-[var(--font-display)] !text-[0.95rem] !font-semibold !tracking-[-0.01em] !leading-snug !text-[color:var(--color-text-heading)]",
  description:
    "!mt-0.5 !text-[0.84rem] !leading-relaxed !text-[color:var(--color-text-secondary)]",
  actionButton:
    "!rounded-[var(--radius-pill)] !border !border-primary/20 !bg-white/90 !px-3.5 !py-1.5 !text-xs !font-semibold !text-primary !shadow-sm !transition-all hover:!border-primary/35 hover:!bg-primary-50 hover:!shadow-md active:!scale-[0.98]",
  cancelButton:
    "!rounded-[var(--radius-pill)] !border !border-[color:var(--color-border-default)]/70 !bg-white/80 !px-3.5 !py-1.5 !text-xs !font-medium !text-[color:var(--color-text-muted)] !transition-colors hover:!bg-[color:var(--color-surface-muted)]",
  closeButton:
    "!left-auto !right-2.5 !top-2.5 !h-7 !w-7 !rounded-full !border !border-black/[0.06] !bg-white/85 !text-[color:var(--color-text-muted)] !shadow-sm !transition-all hover:!scale-105 hover:!border-black/[0.1] hover:!bg-white hover:!text-[color:var(--color-text-primary)] active:!scale-95",
  success: "sv-toast--success",
  error: "sv-toast--error",
  warning: "sv-toast--warning",
  info: "sv-toast--info",
  loading: "sv-toast--loading",
} as const;
