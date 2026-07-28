"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useContactModalStore } from "@/shared/lib/contactModalStore";

interface ContactTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

/** Opens the global contact form modal. */
export function ContactTrigger({ children, onClick, ...props }: ContactTriggerProps) {
  const open = useContactModalStore((s) => s.open);

  return (
    <button
      type="button"
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) open();
      }}
    >
      {children}
    </button>
  );
}
