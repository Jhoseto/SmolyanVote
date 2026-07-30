"use client";

import { useState } from "react";
import { cn } from "@/shared/lib/cn";
import { SignalsInfoContent } from "./SignalsInfoContent";

interface SignalsInfoPanelProps {
  className?: string;
}

/** Explains what signals are, how to submit, boost priority, and why it matters. */
export function SignalsInfoPanel({ className }: SignalsInfoPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("overflow-hidden rounded-[var(--radius-xl)] border border-primary/15 bg-gradient-to-br from-primary-50/70 via-white to-white shadow-[0_4px_24px_rgba(13,110,253,0.06)]", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-primary-50/40"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-[color:var(--color-text-heading)]">
          <i className="bi bi-info-circle text-primary" />
          Как работят гражданските сигнали?
        </span>
        <i className={cn("bi text-[color:var(--color-text-muted)] transition-transform", open ? "bi-chevron-up" : "bi-chevron-down")} />
      </button>

      {open && (
        <div className="space-y-4 border-t border-primary/10 px-4 pb-4 pt-3">
          <SignalsInfoContent />
        </div>
      )}
    </div>
  );
}
