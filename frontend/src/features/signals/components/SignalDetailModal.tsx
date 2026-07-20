"use client";

import { useState, type ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { Avatar, ErrorState, ShareButton, Skeleton } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useRequireAuth } from "@/shared/hooks/useRequireAuth";
import { formatRelativeDate } from "@/shared/lib/formatRelativeDate";
import { categoryIcon } from "../data/categories";
import { useSignalDetail } from "../hooks/useSignalDetail";
import { useToggleSignalLike } from "../hooks/useToggleSignalLike";
import { SignalEditForm } from "./SignalEditForm";
import { DeleteSignalButton } from "./DeleteSignalButton";

interface SignalDetailModalProps {
  id: number | null;
  onClose: () => void;
  /** "Центрирай на картата" — само когато модалът е отворен над картата (list panel), не при `?openSignal=` deep-link без карта наоколо. */
  onCenterOnMap?: (id: number) => void;
  reportSlot?: (signalId: number) => ReactNode;
  commentsSlot?: (id: number) => ReactNode;
}

/** `?openSignal={id}` deep-link modal (MODERN_FRONTEND_PLAN §Signal detail modal) — mirrors `PublicationDetailModal`. */
export function SignalDetailModal({ id, onClose, onCenterOnMap, reportSlot, commentsSlot }: SignalDetailModalProps) {
  const { data: signal, isPending, isError, refetch } = useSignalDetail(id);
  const requireAuth = useRequireAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const [prevId, setPrevId] = useState(id);
  if (id !== prevId) {
    setPrevId(id);
    setIsEditing(false);
    setLightboxOpen(false);
  }

  const { mutate: like, isPending: isLiking } = useToggleSignalLike();

  async function handleLike() {
    if (!signal || !(await requireAuth("да харесаш сигнал"))) return;
    like(signal.id);
  }

  return (
    <Dialog.Root open={id !== null} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[1090] bg-black/50 backdrop-blur-[2px] transition-opacity data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <Dialog.Popup className="fixed inset-0 z-[1091] flex items-start justify-center overflow-y-auto p-4 outline-none sm:items-center">
          <div className="my-8 w-full max-w-[640px] rounded-[var(--radius-lg)] bg-white shadow-[var(--shadow-lg)] transition-all data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0">
            <div className="flex items-center justify-between border-b border-border-default/60 p-4">
              <Dialog.Title className="text-base font-semibold text-[color:var(--color-text-heading)]">Сигнал</Dialog.Title>
              <Dialog.Close
                aria-label="Затвори"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-muted)]"
              >
                <i className="bi bi-x-lg" />
              </Dialog.Close>
            </div>

            <div className="p-4 sm:p-6">
              {isPending && (
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-24 w-full" />
                </div>
              )}

              {isError && <ErrorState description="Сигналът не можа да се зареди." onRetry={() => refetch()} />}

              {signal && isEditing && (
                <SignalEditForm signal={signal} onSaved={() => setIsEditing(false)} onCancel={() => setIsEditing(false)} />
              )}

              {signal && !isEditing && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-bold text-[color:var(--color-text-heading)]">{signal.title}</h2>
                    <span
                      className={cn(
                        "shrink-0 rounded-[var(--radius-pill)] px-2.5 py-1 text-xs font-semibold",
                        signal.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-[color:var(--color-surface-muted)] text-[color:var(--color-text-muted)]",
                      )}
                    >
                      {signal.isActive ? "Активен" : "Изтекъл"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Avatar username={signal.authorUsername ?? "?"} imageUrl={signal.authorImageUrl} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[color:var(--color-text-primary)]">
                        {signal.authorUsername ?? "Анонимен"}
                      </p>
                      <p className="text-xs text-[color:var(--color-text-muted)]">{formatRelativeDate(signal.createdAt)}</p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-pill)] bg-[color:var(--color-surface-muted)] px-3 py-1 text-xs font-semibold text-[color:var(--color-text-secondary)]">
                      <i className={cn("bi", categoryIcon(signal.category))} />
                      {signal.categoryLabel}
                    </span>
                  </div>

                  <p className="whitespace-pre-line text-[color:var(--color-text-secondary)]">{signal.description}</p>

                  {signal.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setLightboxOpen(true)}
                      className="overflow-hidden rounded-[var(--radius-md)] bg-[color:var(--color-surface-muted)]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary URL */}
                      <img src={signal.imageUrl} alt={signal.title} className="max-h-[420px] w-full object-cover" />
                    </button>
                  )}

                  <div className="flex flex-wrap items-center gap-4 border-t border-border-default/60 pt-3 text-xs text-[color:var(--color-text-muted)]">
                    <span className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handleLike}
                        disabled={isLiking}
                        className={cn(
                          "transition-colors hover:text-primary disabled:opacity-50",
                          signal.isLiked && "text-primary",
                        )}
                      >
                        <i className={cn("bi", signal.isLiked ? "bi-hand-thumbs-up-fill" : "bi-hand-thumbs-up")} />
                      </button>
                      {signal.likesCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <i className="bi bi-eye-fill" />
                      {signal.viewsCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <i className="bi bi-chat-fill" />
                      {signal.commentsCount}
                    </span>

                    {onCenterOnMap && (
                      <button
                        type="button"
                        onClick={() => {
                          onCenterOnMap(signal.id);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1.5 hover:text-primary"
                      >
                        <i className="bi bi-geo-alt" />
                        Центрирай на картата
                      </button>
                    )}

                    <div className="ml-auto flex items-center gap-3">
                      <ShareButton
                        title={signal.title}
                        url={
                          typeof window !== "undefined"
                            ? `${window.location.origin}/signals?openSignal=${signal.id}`
                            : `/signals?openSignal=${signal.id}`
                        }
                      />
                      {reportSlot?.(signal.id)}
                      {signal.isOwner && (
                        <button
                          type="button"
                          onClick={() => setIsEditing(true)}
                          className="inline-flex items-center gap-1.5 hover:text-primary"
                        >
                          <i className="bi bi-pencil" />
                          Редактирай
                        </button>
                      )}
                      {signal.isOwner && <DeleteSignalButton id={signal.id} onDeleted={onClose} />}
                    </div>
                  </div>

                  <div className="border-t border-border-default/60 pt-4">{commentsSlot?.(signal.id)}</div>
                </div>
              )}
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>

      {signal?.imageUrl && (
        <Lightbox open={lightboxOpen} close={() => setLightboxOpen(false)} slides={[{ src: signal.imageUrl }]} />
      )}
    </Dialog.Root>
  );
}
