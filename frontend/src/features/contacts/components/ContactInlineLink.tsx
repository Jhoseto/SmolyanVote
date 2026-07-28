"use client";

import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { ContactTrigger } from "./ContactTrigger";

interface ContactInlineLinkProps {
  children: ReactNode;
  className?: string;
}

/** Link-styled button that opens the contact modal (for use inside server components). */
export function ContactInlineLink({ children, className }: ContactInlineLinkProps) {
  return (
    <ContactTrigger className={cn("text-primary underline", className)}>{children}</ContactTrigger>
  );
}
