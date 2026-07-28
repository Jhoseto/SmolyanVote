"use client";

import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

type ToastVariant = "success" | "error" | "warning" | "info" | "default";

const ICONS: Record<ToastVariant, string> = {
  success: "bi-check-lg",
  error: "bi-x-lg",
  warning: "bi-exclamation-lg",
  info: "bi-info-lg",
  default: "bi-bell-fill",
};

export function ToastIcon({ variant }: { variant: ToastVariant }): ReactNode {
  return (
    <span className={cn("sv-toast-icon", `sv-toast-icon--${variant}`)} aria-hidden>
      <i className={cn("bi sv-toast-icon__glyph", ICONS[variant])} />
    </span>
  );
}

/** Sonner class hooks — layout + polish in globals.css (`.sv-toast*`). */
export const toastClassNames = {
  toast: "sv-toast",
  title: "sv-toast__title",
  description: "sv-toast__description",
  actionButton: "sv-toast__action",
  cancelButton: "sv-toast__cancel",
  closeButton: "sv-toast__close",
  success: "sv-toast--success",
  error: "sv-toast--error",
  warning: "sv-toast--warning",
  info: "sv-toast--info",
  loading: "sv-toast--loading",
} as const;
