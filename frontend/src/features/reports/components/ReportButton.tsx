"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Button } from "@/shared/ui";
import { useToast } from "@/shared/hooks/useToast";
import { useRequireAuth } from "@/shared/hooks/useRequireAuth";
import { errorMessage } from "@/shared/lib/errorMessage";
import { useCreateReport } from "../hooks/useCreateReport";
import { REPORT_REASON_LABELS, type ReportableEntityType, type ReportReason } from "../types";

const REASONS = Object.keys(REPORT_REASON_LABELS) as ReportReason[];

interface ReportButtonProps {
  entityType: ReportableEntityType;
  entityId: number;
  className?: string;
}

/** Self-contained "Докладвай" trigger + modal — reused across events, publications, signals, comments. */
export function ReportButton({ entityType, entityId, className }: ReportButtonProps) {
  const toast = useToast();
  const requireAuth = useRequireAuth();
  const { mutate, isPending } = useCreateReport(entityType, entityId);

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("SPAM");
  const [description, setDescription] = useState("");

  async function handleTrigger() {
    if (!(await requireAuth("да докладваш"))) return;
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutate(
      { reason, description: description.trim() || undefined },
      {
        onSuccess: (res) => {
          toast.success(res.message);
          setOpen(false);
          setDescription("");
          setReason("SPAM");
        },
        onError: (error) => toast.error(errorMessage(error, "Докладването не бе успешно.")),
      },
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={handleTrigger}
        className={className ?? "inline-flex items-center gap-1.5 text-sm text-[color:var(--color-text-muted)] hover:text-[color:var(--color-error)]"}
      >
        <i className="bi bi-flag" />
        Докладвай
      </button>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[1090] bg-black/40 backdrop-blur-[2px] transition-opacity data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <Dialog.Popup className="fixed inset-0 z-[1091] flex items-center justify-center p-4 outline-none">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-[440px] rounded-[var(--radius-lg)] bg-white p-6 shadow-[var(--shadow-lg)] transition-all data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0"
          >
            <Dialog.Title className="text-lg font-bold text-[color:var(--color-text-heading)]">
              Докладване
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
              Изберете причина за докладването. Прегледаните доклади помагат да пазим общността чиста.
            </Dialog.Description>

            <div className="mt-4 flex flex-col gap-2">
              {REASONS.map((r) => (
                <label
                  key={r}
                  className="flex items-center gap-2.5 rounded-[var(--radius-md)] border border-border-default/60 px-3 py-2 text-sm has-checked:border-primary has-checked:bg-primary-50"
                >
                  <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} />
                  {REPORT_REASON_LABELS[r]}
                </label>
              ))}
            </div>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              placeholder="Допълнителни детайли (по избор)…"
              rows={3}
              className="mt-3 w-full resize-none rounded-[var(--radius-md)] border border-border-default/60 p-3 text-sm outline-none focus:border-primary"
            />

            <div className="mt-6 flex justify-end gap-3">
              <Dialog.Close
                render={
                  <Button type="button" variant="outline" size="sm">
                    Отказ
                  </Button>
                }
              />
              <Button type="submit" size="sm" disabled={isPending}>
                Изпрати доклад
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
