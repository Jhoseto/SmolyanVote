import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/** Generic "no results" state — replaces V1's ad-hoc empty-state markup per feature. */
export function EmptyState({ icon = "bi-inbox", title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3 px-6 py-16 text-center", className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--color-surface-muted)]">
        <i className={cn("bi text-[1.75rem] text-[color:var(--color-text-muted)]", icon)} />
      </div>
      <h3 className="text-base font-semibold text-[color:var(--color-text-heading)]">{title}</h3>
      {description && (
        <p className="max-w-[380px] text-sm text-[color:var(--color-text-secondary)]">{description}</p>
      )}
      {action}
    </div>
  );
}
