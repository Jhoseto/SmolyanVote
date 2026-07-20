import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

/** Generic surface card (DESIGN_BRIEF §10.3) — white, rounded, soft shadow. */
export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] bg-white border border-border-default/60 shadow-[var(--shadow-md)]",
        className,
      )}
      {...props}
    />
  );
}
