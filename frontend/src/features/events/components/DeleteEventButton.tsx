"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/shared/lib/authContext";
import { useToast } from "@/shared/hooks/useToast";
import { useConfirm } from "@/shared/hooks/useConfirm";
import { errorMessage } from "@/shared/lib/errorMessage";
import { useDeleteEvent } from "../hooks/useDeleteEvent";

interface DeleteEventButtonProps {
  id: number;
  creatorUsername: string;
  className?: string;
}

/** Self-contained "Изтрий" trigger — visible only to the creator or an admin, mirrors `DeleteEventsService.canUserDeleteEvent`. */
export function DeleteEventButton({ id, creatorUsername, className }: DeleteEventButtonProps) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const { user } = useAuth();
  const { mutate, isPending } = useDeleteEvent();

  const canDelete = !!user && (user.role === "ADMIN" || user.username === creatorUsername);
  if (!canDelete) return null;

  async function handleClick() {
    const ok = await confirm({
      title: "Изтриване",
      description: "Сигурни ли сте, че искате да изтриете това съдържание? Действието е необратимо.",
      confirmText: "Изтрий",
      destructive: true,
    });
    if (!ok) return;

    mutate(id, {
      onSuccess: () => {
        toast.success("Изтрито успешно.");
        router.push("/events");
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
