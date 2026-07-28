"use client";

import { toast as sonner, type ExternalToast } from "sonner";
import type { ReactNode } from "react";
import { ToastIcon, toastClassNames } from "@/shared/lib/toastPresentation";

type ToastVariant = "success" | "error" | "warning" | "info" | "default";

function mergeOptions(variant: ToastVariant, options?: ExternalToast): ExternalToast {
  const iconVariant = variant === "default" ? "default" : variant;
  return {
    ...options,
    icon: options?.icon ?? ToastIcon({ variant: iconVariant }),
    classNames: {
      ...toastClassNames,
      ...options?.classNames,
      toast: [toastClassNames.toast, variant !== "default" ? toastClassNames[variant] : ""]
        .filter(Boolean)
        .join(" "),
    },
  };
}

function toastMessage(message: ReactNode, options?: ExternalToast) {
  return sonner(message, mergeOptions("default", options));
}

/**
 * Unified SmolyanVote toast API (Sonner wrapper).
 * Branded icons, typography and shadows — mount `<Toaster />` once in `AppProviders`.
 */
export const toast = Object.assign(toastMessage, {
  success: (message: ReactNode, options?: ExternalToast) =>
    sonner.success(message, mergeOptions("success", options)),
  error: (message: ReactNode, options?: ExternalToast) =>
    sonner.error(message, mergeOptions("error", options)),
  warning: (message: ReactNode, options?: ExternalToast) =>
    sonner.warning(message, mergeOptions("warning", options)),
  info: (message: ReactNode, options?: ExternalToast) =>
    sonner.info(message, mergeOptions("info", options)),
  message: sonner.message,
  promise: sonner.promise,
  loading: sonner.loading,
  dismiss: sonner.dismiss,
  custom: sonner.custom,
});

export function useToast() {
  return toast;
}
