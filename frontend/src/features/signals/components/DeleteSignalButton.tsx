"use client";

import { useToast } from "@/shared/hooks/useToast";
import { useConfirm } from "@/shared/hooks/useConfirm";
import { errorMessage } from "@/shared/lib/errorMessage";
import { useDeleteSignal } from "../hooks/useDeleteSignal";

interface DeleteSignalButtonProps {
  id: number;
  className?: string;
  onDeleted?: () => void;
}

/** Visibility (owner/admin) decided by the caller via `Signal.isOwner` — mirrors `DeletePublicationButton`. */
export function DeleteSignalButton({ id, className, onDeleted }: DeleteSignalButtonProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const { mutate, isPending } = useDeleteSignal();

  async function handleClick() {
    const ok = await confirm({
      title: "Изтриване на сигнал",
      description: "Сигурни ли сте, че искате да изтриете този сигнал? Действието е необратимо.",
      confirmText: "Изтрий",
      destructive: true,
    });
    if (!ok) return;

    mutate(id, {
      onSuccess: () => {
        toast.success("Сигналът е изтрит успешно.");
        onDeleted?.();
      },
      onError: (error) => toast.error(errorMessage(error, "Възникна грешка при изтриването.")),
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={
        className ??
        "inline-flex items-center gap-1.5 text-sm text-[color:var(--color-text-muted)] hover:text-[color:var(--color-error)] disabled:opacity-50"
      }
    >
      <i className="bi bi-trash3" />
      Изтрий
    </button>
  );
}
