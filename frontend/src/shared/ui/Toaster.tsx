"use client";

import { Toaster as SonnerToaster } from "sonner";

/**
 * Single global toast host (Sonner). Mounted once in `AppProviders`.
 * Styled to match DESIGN_BRIEF tokens — no default Sonner theme leaks through.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      gap={10}
      style={{ zIndex: 1200 }}
      toastOptions={{
        duration: 4000,
        classNames: {
          toast:
            "rounded-[var(--radius-md)] border border-border-default/60 bg-white shadow-[var(--shadow-dropdown)] font-[var(--font-body)] text-[color:var(--color-text-primary)]",
          title: "text-[0.9rem] font-semibold text-[color:var(--color-text-heading)]",
          description: "text-[0.85rem] text-[color:var(--color-text-secondary)]",
          success: "[&>svg]:text-[color:var(--color-success)]",
          error: "[&>svg]:text-[color:var(--color-error)]",
          warning: "[&>svg]:text-[color:var(--color-warning)]",
          info: "[&>svg]:text-[color:var(--color-info)]",
          closeButton:
            "border-border-default/60 bg-white text-[color:var(--color-text-muted)]",
        },
      }}
      closeButton
    />
  );
}
