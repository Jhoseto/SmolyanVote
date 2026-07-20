"use client";

import type { ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Avatar, EmptyState, Skeleton } from "@/shared/ui";
import { useReactionUsers } from "../hooks/useReactionUsers";

interface ReactionUsersModalProps {
  publicationId: number | null;
  type: "like" | "dislike" | null;
  onClose: () => void;
  /** "Следвай" по потребител — композиран от `app/` (features не импортират features). */
  renderFollowSlot?: (userId: number) => ReactNode;
}

/** "Кой реагира" — MODERN_FRONTEND_PLAN.md §Reaction users modal, порт на legacy `reactionUsersModal.js` (без pagination, като оригинала). */
export function ReactionUsersModal({ publicationId, type, onClose, renderFollowSlot }: ReactionUsersModalProps) {
  const open = publicationId !== null && type !== null;
  const { data, isPending } = useReactionUsers(publicationId, type ?? "like");

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[1090] bg-black/40 backdrop-blur-[2px] transition-opacity data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <Dialog.Popup className="fixed inset-0 z-[1091] flex items-center justify-center p-4 outline-none">
          <div className="w-full max-w-[400px] rounded-[var(--radius-lg)] bg-white p-6 shadow-[var(--shadow-lg)] transition-all data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-lg font-bold text-[color:var(--color-text-heading)]">
                {type === "dislike" ? "Не харесали публикацията" : "Харесали публикацията"}
              </Dialog.Title>
              <Dialog.Close
                aria-label="Затвори"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-muted)]"
              >
                <i className="bi bi-x-lg" />
              </Dialog.Close>
            </div>

            <div className="mt-4 flex max-h-[400px] flex-col gap-1 overflow-y-auto">
              {isPending &&
                Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-11 w-full rounded-[var(--radius-md)]" />)}

              {data && data.length === 0 && <EmptyState icon="bi-emoji-neutral" title="Все още никой" />}

              {data?.map((user) => (
                <div key={user.id} className="flex items-center gap-2.5 rounded-[var(--radius-md)] px-1 py-2">
                  <Avatar username={user.username} imageUrl={user.imageUrl} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[color:var(--color-text-primary)]">
                      {user.fullName || user.username}
                    </p>
                    <p className="truncate text-xs text-[color:var(--color-text-muted)]">@{user.username}</p>
                  </div>
                  {renderFollowSlot?.(user.id)}
                </div>
              ))}
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
