"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/ui/Button";
import { AlertDialogDescriptionPanel } from "@/shared/ui/DialogDescriptionPanel";
import { useModerationStore } from "@/shared/lib/moderationStore";

function violationLabel(type?: string): string {
  switch (type) {
    case "IMAGE":
      return "неподходящо изображение";
    case "SPAM":
      return "spam съдържание";
    default:
      return "неподходящ текст";
  }
}

/** Global host for moderation / strike warning modals. */
export function ModerationWarningHost() {
  const warning = useModerationStore((s) => s.warning);
  const dismiss = useModerationStore((s) => s.dismissWarning);
  const queryClient = useQueryClient();

  function handleClose() {
    dismiss();
    void queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
  }

  return (
    <AlertDialog.Root
      open={warning !== null}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-[1130] bg-black/55 backdrop-blur-[6px]" />
        <AlertDialog.Popup className="fixed inset-0 z-[1131] flex items-center justify-center p-4 outline-none">
          <div className="w-full max-w-md rounded-[var(--radius-lg)] bg-white p-6 shadow-[var(--shadow-lg)]">
            <div className="flex flex-col items-center gap-3 text-center">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full ${
                  warning?.autoBanned ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                }`}
              >
                <i
                  className={`bi ${warning?.autoBanned ? "bi-shield-x" : "bi-exclamation-triangle"} text-2xl`}
                  aria-hidden
                />
              </div>
              <AlertDialog.Title className="font-display text-lg font-bold text-[color:var(--color-text-heading)]">
                {warning?.title ?? "Предупреждение"}
              </AlertDialog.Title>
            </div>

            <AlertDialogDescriptionPanel className="mt-4 space-y-3 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
              <p>{warning?.message}</p>

              {warning?.violationType && !warning.autoBanned && (
                <p className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-3 py-2 text-left text-amber-950">
                  Причината е опит за публикуване на{" "}
                  <strong>{violationLabel(warning.violationType)}</strong>. Профилът ви ще бъде
                  прегледан за злонамерено поведение.
                </p>
              )}

              {!warning?.autoBanned &&
                warning?.strikeCount != null &&
                warning.strikesUntilBan != null && (
                  <p className="text-center text-xs font-medium text-[color:var(--color-text-muted)]">
                    Предупреждение {warning.strikeCount} от 3 · остават {warning.strikesUntilBan}{" "}
                    преди 1-часов бан
                  </p>
                )}

              {warning?.autoBanned && warning.banEndDate && (
                <p className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-3 py-2 text-left text-red-900">
                  Можете само да разглеждате съдържание до{" "}
                  <strong>{new Date(warning.banEndDate).toLocaleString("bg-BG")}</strong>.
                </p>
              )}
            </AlertDialogDescriptionPanel>

            <div className="mt-6 flex justify-center">
              <Button variant="primary" size="sm" onClick={handleClose}>
                Разбрах
              </Button>
            </div>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
