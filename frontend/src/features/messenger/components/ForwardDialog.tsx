"use client";

import { useMemo, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Avatar } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useConversations } from "../hooks/useConversations";
import { useForwardMessage } from "../hooks/useMessageActions";
import { fuzzyScore } from "../lib/fuzzyMatch";
import { describeConversation } from "../lib/conversationDisplay";

interface ForwardDialogProps {
  messageId: number;
  excludeConversationId: number;
  onClose: () => void;
}

/** Pick one or more conversations to forward a message into. */
export function ForwardDialog({ messageId, excludeConversationId, onClose }: ForwardDialogProps) {
  const { data: conversations = [] } = useConversations();
  const forward = useForwardMessage();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<number[]>([]);

  const targets = useMemo(() => {
    const list = conversations.filter((c) => c.id !== excludeConversationId);
    if (!query.trim()) return list;
    return list
      .map((c) => ({
        conversation: c,
        score: fuzzyScore(describeConversation(c).name, query),
      }))
      .filter((row): row is { conversation: (typeof list)[number]; score: number } => row.score !== null)
      .sort((a, b) => b.score - a.score)
      .map((row) => row.conversation);
  }, [conversations, excludeConversationId, query]);

  async function submit() {
    await Promise.all(
      selected.map((conversationId) => forward.mutateAsync({ messageId, conversationId })),
    );
    onClose();
  }

  return (
    <Dialog.Root open onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[1100] bg-black/40 backdrop-blur-[2px] transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed inset-0 z-[1101] flex items-center justify-center p-4 outline-none">
          <div
            className="sv-msg sv-msg-surface relative flex max-h-[70vh] w-full max-w-md flex-col overflow-hidden"
            data-glass="on"
          >
            <Dialog.Title className="px-4 pb-2 pt-3.5 text-sm font-semibold">
              Препрати съобщението
            </Dialog.Title>

            <div className="px-4 pb-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Търси разговор…"
                aria-label="Търси разговор"
                autoFocus
                className="w-full rounded-[var(--radius-md)] border border-border-default/60 bg-white px-3 py-1.5 text-[13px] outline-none focus:border-[color:var(--color-primary)]"
              />
            </div>

            <div className="sv-msg-brandline" aria-hidden />

            <ul className="sv-scrollbar min-h-0 flex-1 overflow-y-auto p-1.5">
              {targets.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-[color:var(--color-text-muted)]">
                  Няма други разговори
                </li>
              )}
              {targets.map((conversation) => {
                const checked = selected.includes(conversation.id);
                const display = describeConversation(conversation);
                return (
                  <li key={conversation.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setSelected((prev) =>
                          checked ? prev.filter((id) => id !== conversation.id) : [...prev, conversation.id],
                        )
                      }
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-left",
                        checked
                          ? "bg-[color:var(--color-primary-50)] text-[color:var(--color-primary)]"
                          : "hover:bg-[color:var(--color-surface-light)]",
                      )}
                    >
                      <Avatar
                        username={display.avatarSeed}
                        imageUrl={display.imageUrl}
                        size={30}
                      />
                      <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                        {display.isGroup && <i className="bi bi-people-fill mr-1.5 text-[11px] opacity-60" />}
                        {display.name}
                      </span>
                      <i
                        className={cn(
                          "bi shrink-0",
                          checked ? "bi-check-circle-fill" : "bi-circle opacity-30",
                        )}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center justify-end gap-2 border-t border-border-default/50 px-4 py-2.5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-[var(--radius-md)] px-3 py-1.5 text-[13px] text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-light)]"
              >
                Отказ
              </button>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={selected.length === 0 || forward.isPending}
                className="rounded-[var(--radius-md)] bg-[color:var(--color-primary)] px-3.5 py-1.5 text-[13px] font-semibold text-white disabled:opacity-50"
              >
                Препрати{selected.length > 1 ? ` (${selected.length})` : ""}
              </button>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
