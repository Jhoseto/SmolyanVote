"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

interface CollapsibleSectionProps {
  title: string;
  icon?: string;
  defaultOpen?: boolean;
  badge?: ReactNode;
  children: ReactNode;
}

export function CollapsibleSection({
  title,
  icon,
  defaultOpen = true,
  badge,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="overflow-hidden rounded-[var(--radius-lg)] border border-border-default/60 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-[color:var(--color-surface-muted)]"
      >
        {icon && <i className={cn("bi text-primary", icon)} />}
        <span className="flex-1 text-sm font-bold text-[color:var(--color-text-heading)]">{title}</span>
        {badge}
        <i className={cn("bi bi-chevron-down text-xs transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="border-t border-border-default/60 p-4">{children}</div>}
    </section>
  );
}
