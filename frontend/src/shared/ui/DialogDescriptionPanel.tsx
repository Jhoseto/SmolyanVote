import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Dialog } from "@base-ui/react/dialog";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

/**
 * Base UI `Description` components render a `<p>`.
 * Use these panels when the body includes block elements (div, ul, label, …)
 * to avoid invalid HTML and React hydration errors.
 */
export function AlertDialogDescriptionPanel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <AlertDialog.Description render={<div className={cn(className)} />}>{children}</AlertDialog.Description>
  );
}

export function DialogDescriptionPanel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Description render={<div className={cn(className)} />}>{children}</Dialog.Description>
  );
}
