"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/shared/lib/authContext";
import { useConfirm } from "@/shared/hooks/useConfirm";
import { useToast } from "@/shared/hooks/useToast";
import { errorMessage } from "@/shared/lib/errorMessage";
import { cn } from "@/shared/lib/cn";
import { DeletePublicationButton } from "./DeletePublicationButton";

interface PublicationModerationMenuProps {
  publicationId: number;
  authorId: number | null;
  authorUsername: string | null;
  isOwner: boolean;
  onEdit?: () => void;
  onDeleted?: () => void;
}

/**
 * Owner + ADMIN actions: edit/delete publication; ADMIN can ban author.
 * Uses admin REST paths directly (no features→features import).
 */
export function PublicationModerationMenu({
  publicationId,
  authorId,
  authorUsername,
  isOwner,
  onEdit,
  onDeleted,
}: PublicationModerationMenuProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const canModerate = isOwner || isAdmin;
  const [open, setOpen] = useState(false);
  const [banOpen, setBanOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banBusy, setBanBusy] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();
  const router = useRouter();

  if (!canModerate) return null;

  async function handleBan() {
    if (!authorId || !banReason.trim()) {
      toast.error("Въведете причина за бана.");
      return;
    }
    const ok = await confirm({
      title: "Бан на потребител",
      description: `Сигурни ли сте, че искате да блокирате ${authorUsername ?? "този потребител"}?`,
      confirmText: "Бан",
      destructive: true,
    });
    if (!ok) return;

    setBanBusy(true);
    try {
      await apiClient.post(`/admin/users/${authorId}/ban`, {
        body: { reason: banReason.trim(), banType: "temporary", durationDays: 7 },
      });
      toast.success("Потребителят е блокиран.");
      setBanOpen(false);
      setOpen(false);
    } catch (error) {
      toast.error(errorMessage(error, "Банът не успя."));
    } finally {
      setBanBusy(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Опции"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-muted)]"
      >
        <i className="bi bi-three-dots" />
      </button>

      {open && (
        <>
          <button type="button" className="fixed inset-0 z-10 cursor-default" aria-label="Затвори" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 min-w-[180px] overflow-hidden rounded-[var(--radius-md)] border border-border-default/60 bg-white py-1 shadow-[var(--shadow-dropdown)]">
            {(isOwner || isAdmin) && onEdit && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onEdit();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-primary-50"
              >
                <i className="bi bi-pencil" />
                Редактирай
              </button>
            )}
            <div className="px-1 py-0.5">
              <DeletePublicationButton
                id={publicationId}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[color:var(--color-error)] hover:bg-red-50 disabled:opacity-50"
                onDeleted={() => {
                  setOpen(false);
                  onDeleted?.();
                }}
              />
            </div>
            {isAdmin && authorId && authorId !== user?.id && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setBanOpen(true);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[color:var(--color-error)] hover:bg-red-50"
              >
                <i className="bi bi-shield-x" />
                Бан на автора
              </button>
            )}
            {isAdmin && authorUsername && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  router.push(`/user/${encodeURIComponent(authorUsername)}`);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-primary-50"
              >
                <i className="bi bi-person" />
                Профил
              </button>
            )}
          </div>
        </>
      )}

      {banOpen && (
        <div className="fixed inset-0 z-[1120] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[var(--radius-lg)] bg-white p-5 shadow-[var(--shadow-lg)]">
            <h3 className="font-display text-base font-semibold">Бан · @{authorUsername}</h3>
            <p className="mt-1 text-xs text-[color:var(--color-text-muted)]">Временен бан 7 дни</p>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              rows={3}
              placeholder="Причина…"
              className="mt-3 w-full rounded-[var(--radius-md)] border border-border-default/60 px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setBanOpen(false)}
                className="rounded-[var(--radius-md)] px-3 py-1.5 text-sm text-[color:var(--color-text-secondary)]"
              >
                Отказ
              </button>
              <button
                type="button"
                disabled={banBusy}
                onClick={() => void handleBan()}
                className={cn(
                  "rounded-[var(--radius-md)] bg-[color:var(--color-error)] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60",
                )}
              >
                {banBusy ? "…" : "Бан"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
