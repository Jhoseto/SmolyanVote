"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { monitorSegmentClass, type MonitorSegmentVariant } from "../lib/monitorSegmentStyles";

interface MonitorSegmentButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active: boolean;
  variant?: MonitorSegmentVariant;
  children: ReactNode;
}

export function MonitorSegmentButton({
  active,
  variant = "muted",
  className,
  children,
  type = "button",
  ...rest
}: MonitorSegmentButtonProps) {
  return (
    <button
      type={type}
      className={monitorSegmentClass(active, { variant, className })}
      {...rest}
    >
      {children}
    </button>
  );
}
