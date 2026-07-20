"use client";

import { useToast } from "@/shared/hooks/useToast";
import { useConfirm } from "@/shared/hooks/useConfirm";
import { errorMessage } from "@/shared/lib/errorMessage";
import { useDeletePublication } from "../hooks/useDeletePublication";

interface DeletePublicationButtonProps {
  id: number;
  className?: string;
  /** Called after a successful delete — e.g. to close the detail modal. */
  onDeleted?: () => void;
}

/** Visibility (owner/admin) is decided by the caller via `Publication.isOwner` — mirrors `DeleteEventButton`. */
export function DeletePublicationButton({ id, className, onDeleted }: DeletePublicationButtonProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const { mutate, isPending } = useDeletePublication();

  async function handleClick() {
    const ok = await confirm({
      title: "Изтриване на публикация",
      description: "Сигурни ли сте, че искате да изтриете тази публикация? Действието е необратимо.",
      confirmText: "Изтрий",
      destructive: true,
    });
    if (!ok) return;

    mutate(id, {
      onSuccess: () => {
        toast.success("Публикацията е изтрита успешно.");
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
