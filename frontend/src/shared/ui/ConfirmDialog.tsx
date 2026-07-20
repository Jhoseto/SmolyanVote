"use client";

import { useEffect, useState } from "react";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { useConfirmStore } from "@/shared/lib/confirmStore";
import { Button } from "./Button";

/**
 * Single global confirm-dialog host (Base UI AlertDialog). Mounted once in
 * `AppProviders`; opened imperatively via `useConfirm()`.
 *
 * When `options.voteConfirm` is set, renders the v1 `voteConfirmModal` layout
 * (badges + irreversible warning + acknowledgment checkbox).
 */
export function ConfirmDialogHost() {
  const options = useConfirmStore((s) => s.options);
  const respond = useConfirmStore((s) => s.respond);
  const [ackChecked, setAckChecked] = useState(false);

  useEffect(() => {
    setAckChecked(false);
  }, [options]);

  const vote = options?.voteConfirm;
  const plural = vote?.plural ?? false;
  const confirmEnabled = !vote || ackChecked;

  return (
    <AlertDialog.Root
      open={options !== null}
      onOpenChange={(open) => {
        if (!open) respond(false);
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-[1090] bg-black/50 backdrop-blur-[6px] transition-opacity data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <AlertDialog.Popup className="fixed inset-0 z-[1091] flex items-center justify-center p-4 outline-none">
          <div className="w-full max-w-[440px] rounded-[var(--radius-lg)] bg-white p-6 shadow-[var(--shadow-lg)] transition-all data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0">
            {vote ? (
              <>
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                    <i className="bi bi-exclamation-triangle text-2xl" aria-hidden />
                  </div>
                  <AlertDialog.Title className="text-lg font-bold text-[color:var(--color-text-heading)]">
                    {options?.title ??
                      (plural ? "Потвърдете вашите гласове" : "Потвърдете вашия глас")}
                  </AlertDialog.Title>
                </div>

                <AlertDialog.Description className="mt-5 space-y-4 text-sm text-[color:var(--color-text-secondary)]">
                  <div className="text-center">
                    <p className="text-[color:var(--color-text-primary)]">
                      {plural ? "Вие избрахте да гласувате за:" : "Вие избрахте да гласувате с:"}
                    </p>
                    <ul className="mt-3 flex flex-col items-center gap-2">
                      {vote.selectedLabels.map((label) => (
                        <li
                          key={label}
                          className="inline-flex max-w-full rounded-[var(--radius-pill)] bg-primary-50 px-3.5 py-1.5 text-sm font-medium text-primary"
                        >
                          <span className="truncate">{label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex gap-3 rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-3.5 py-3 text-left text-amber-950">
                    <i className="bi bi-info-circle mt-0.5 shrink-0 text-lg text-amber-600" aria-hidden />
                    <p>
                      {plural ? (
                        <>
                          <strong>Внимание:</strong> След като потвърдите гласовете си, те{" "}
                          <strong>не могат да бъдат променяни</strong>. Моля, уверете се че сте
                          направили правилния избор.
                        </>
                      ) : (
                        <>
                          <strong>Внимание:</strong> След като потвърдите гласа си, той{" "}
                          <strong>не може да бъде променян</strong>. Моля, уверете се че сте
                          направили правилния избор.
                        </>
                      )}
                    </p>
                  </div>

                  <label className="flex cursor-pointer items-start gap-2.5 rounded-[var(--radius-md)] border border-border-default/60 bg-[#f8f9fa] px-3.5 py-3 text-left text-[color:var(--color-text-primary)]">
                    <input
                      type="checkbox"
                      checked={ackChecked}
                      onChange={(e) => setAckChecked(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-border-default/60"
                    />
                    <span>
                      {plural
                        ? "Разбирам, че след потвърждение гласовете не могат да бъдат променяни."
                        : "Разбирам, че след потвърждение гласът не може да бъде променян."}
                    </span>
                  </label>
                </AlertDialog.Description>
              </>
            ) : (
              <>
                <AlertDialog.Title className="text-lg font-bold text-[color:var(--color-text-heading)]">
                  {options?.title}
                </AlertDialog.Title>
                {options?.description && (
                  <AlertDialog.Description className="mt-2 text-sm text-[color:var(--color-text-secondary)]">
                    {options.description}
                  </AlertDialog.Description>
                )}
              </>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <AlertDialog.Close
                render={
                  <Button variant="outline" size="sm">
                    {options?.cancelText ?? "Отказ"}
                  </Button>
                }
              />
              <Button
                variant="primary"
                size="sm"
                disabled={!confirmEnabled}
                className={
                  options?.destructive
                    ? "!bg-[image:none] !bg-[color:var(--color-error)] hover:!shadow-[var(--shadow-lg)]"
                    : undefined
                }
                onClick={() => respond(true)}
              >
                {options?.confirmText ?? "Потвърди"}
              </Button>
            </div>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
