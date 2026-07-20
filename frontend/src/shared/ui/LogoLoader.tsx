"use client";

import Image from "next/image";
import { cn } from "@/shared/lib/cn";

type LogoLoaderSize = "sm" | "md" | "lg";

interface LogoLoaderProps {
  /** Accessible status text (also shown under the logo when `showLabel`). */
  label?: string;
  showLabel?: boolean;
  size?: LogoLoaderSize;
  /** Covers the viewport (route transitions / auth gates). */
  fullScreen?: boolean;
  /** Soft overlay over a relative parent (e.g. events grid while refetching). */
  overlay?: boolean;
  className?: string;
}

const SIZES: Record<LogoLoaderSize, { box: string; logo: number; ring: string }> = {
  sm: { box: "h-10 w-10", logo: 22, ring: "border-2" },
  md: { box: "h-16 w-16", logo: 36, ring: "border-[3px]" },
  lg: { box: "h-24 w-24", logo: 56, ring: "border-4" },
};

/**
 * Brand loading indicator — animated logo + orbit ring.
 * Use for page/route loads, refetch overlays, and inline “Зареждане…” spots.
 */
export function LogoLoader({
  label = "Зареждане…",
  showLabel = true,
  size = "md",
  fullScreen = false,
  overlay = false,
  className,
}: LogoLoaderProps) {
  const s = SIZES[size];

  const content = (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn("flex flex-col items-center justify-center gap-3", className)}
    >
      <div className={cn("relative flex items-center justify-center", s.box)}>
        <span
          aria-hidden
          className={cn(
            "logo-loader-ring absolute inset-0 rounded-full border-transparent border-t-primary border-r-primary/40",
            s.ring,
          )}
        />
        <span
          aria-hidden
          className="logo-loader-pulse absolute inset-1 rounded-full bg-primary/10"
        />
        <Image
          src="/images/logoNew.png"
          alt=""
          width={s.logo}
          height={s.logo}
          className="logo-loader-logo relative z-10 object-contain"
          priority
        />
      </div>
      {showLabel && (
        <p className="text-sm font-medium tracking-wide text-[color:var(--color-text-secondary)]">
          {label}
        </p>
      )}
      <span className="sr-only">{label}</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-[calc(100vh-var(--navbar-height))] w-full items-center justify-center bg-white/80 backdrop-blur-[2px]">
        {content}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[inherit] bg-white/70 backdrop-blur-[1px]">
        {content}
      </div>
    );
  }

  return content;
}
