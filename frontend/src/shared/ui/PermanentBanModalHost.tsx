"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Button } from "@/shared/ui/Button";
import { AlertDialogDescriptionPanel } from "@/shared/ui/DialogDescriptionPanel";
import { useModerationStore } from "@/shared/lib/moderationStore";

/** Full-screen modal when login is blocked by a permanent ban. */
export function PermanentBanModalHost() {
  const permanentBan = useModerationStore((s) => s.permanentBan);
  const dismiss = useModerationStore((s) => s.dismissPermanentBan);

  return (
    <AlertDialog.Root open={permanentBan !== null}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-[1140] bg-black/70 backdrop-blur-md" />
        <AlertDialog.Popup className="fixed inset-0 z-[1141] flex items-center justify-center p-4 outline-none">
          <div className="w-full max-w-lg rounded-[var(--radius-lg)] bg-white p-8 shadow-[var(--shadow-lg)]">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
                <i className="bi bi-shield-lock text-3xl" aria-hidden />
              </div>
              <AlertDialog.Title className="font-display text-xl font-bold text-[color:var(--color-text-heading)]">
                Профилът е перманентно блокиран
              </AlertDialog.Title>
              <AlertDialogDescriptionPanel className="space-y-3 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                <p>
                  Входът в платформата не е възможен. Ако смятате, че това е грешка, свържете се с нас на{" "}
                  <a href="mailto:smolyanvote@gmail.com" className="font-medium text-primary underline">
                    smolyanvote@gmail.com
                  </a>
                  .
                </p>
                {permanentBan?.banReason && (
                  <div className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-4 py-3 text-left text-red-900">
                    <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                      Причина от администратор
                    </p>
                    <p className="mt-1">{permanentBan.banReason}</p>
                  </div>
                )}
              </AlertDialogDescriptionPanel>
              <Button variant="primary" size="sm" onClick={dismiss}>
                Затвори
              </Button>
            </div>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
