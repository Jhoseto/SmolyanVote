import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

/** Centered content column, max ~1200px (DESIGN_BRIEF §5). */
export function Container({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mx-auto w-full max-w-[1200px] px-4 sm:px-6", className)}
      {...props}
    />
  );
}
