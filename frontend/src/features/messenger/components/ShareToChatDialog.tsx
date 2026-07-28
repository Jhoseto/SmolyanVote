"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Avatar } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useToast } from "@/shared/hooks/useToast";
import { onShareToChat, type ShareToChatPayload } from "@/shared/lib/shareToChat";
import { useConversations } from "../hooks/useConversations";
import { useSendMessage } from "../hooks/useSendMessage";
import { fuzzyScore } from "../lib/fuzzyMatch";
import { describeConversation } from "../lib/conversationDisplay";
import { useIsDesktopMessenger } from "../lib/isDesktopMessenger";
import { useMessengerUiStore } from "../store/messengerUiStore";
import { GroupAvatar } from "./GroupAvatar";

/** Listens for share requests from other features and posts the link into a chat. */
export function ShareToChatDialog() {
  const [payload, setPayload] = useState<ShareToChatPayload | null>(null);
  const isDesktop = useIsDesktopMessenger();
  const setDownloadModalOpen = useMessengerUiStore((s) => s.setDownloadModalOpen);

  useEffect(
    () =>
      onShareToChat((next) => {
        if (!isDesktop) {
          setDownloadModalOpen(true);
          return;
        }
        setPayload(next);
      }),
    [isDesktop, setDownloadModalOpen],
  );

  if (!payload) return null;
  return <Picker payload={payload} onClose={() => setPayload(null)} />;
}

function Picker({ payload, onClose }: { payload: ShareToChatPayload; onClose: () => void }) {
  const { data: conversations = [] } = useConversations();
  const openChat = useMessengerUiStore((s) => s.openChat);
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState<number | null>(null);

  const body = useMemo(() => {
    const absolute =
      payload.url.startsWith("http") || typeof window === "undefined"
        ? payload.url
        : `${window.location.origin}${payload.url}`;
    return payload.title ? `${payload.title}\n${absolute}` : absolute;
  }, [payload]);

  const { mutate: send, isPending } = useSendMessage(target ?? 0);

  const targets = useMemo(() => {
    if (!query.trim()) return conversations;
    return conversations
      .map((c) => ({
        conversation: c,
        score: fuzzyScore(describeConversation(c).name, query),
      }))
      .filter((row): row is { conversation: (typeof conversations)[number]; score: number } =>
        row.score !== null,
      )
      .sort((a, b) => b.score - a.score)
      .map((row) => row.conversation);
  }, [conversations, query]);

  function submit() {
    if (target == null) return;
    send(
      { text: body, parentMessageId: null },
      {
        onSuccess: () => {
          toast.success("Изпратено в чата.");
          openChat(target);
          onClose();
        },
        onError: () => toast.error("Изпращането не успя."),
      },
    );
  }

  return (
    <Dialog.Root open onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[1100] bg-black/40 backdrop-blur-[2px]" />
        <Dialog.Popup className="fixed inset-0 z-[1101] flex items-center justify-center p-4 outline-none">
          <div
            className="sv-msg sv-msg-surface relative flex max-h-[70vh] w-full max-w-md flex-col overflow-hidden"
            data-glass="on"
          >
            <Dialog.Title className="px-4 pb-2 pt-3.5 text-sm font-semibold">
              Изпрати в чат
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
                  Няма разговори
                </li>
              )}
              {targets.map((conversation) => {
                const display = describeConversation(conversation);
                return (
                <li key={conversation.id}>
                  <button
                    type="button"
                    onClick={() => setTarget(conversation.id)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-left",
                      target === conversation.id
                        ? "bg-[color:var(--color-primary-50)] text-[color:var(--color-primary)]"
                        : "hover:bg-[color:var(--color-surface-light)]",
                    )}
                  >
                    {display.isGroup ? (
                      <GroupAvatar
                        title={display.name}
                        imageUrl={display.imageUrl}
                        members={display.members}
                        size={30}
                      />
                    ) : (
                      <Avatar
                        username={display.avatarSeed}
                        imageUrl={display.imageUrl}
                        size={30}
                      />
                    )}
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                      {display.name}
                    </span>
                    {target === conversation.id && <i className="bi bi-check-circle-fill shrink-0" />}
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
                onClick={submit}
                disabled={target == null || isPending}
                className="rounded-[var(--radius-md)] bg-[color:var(--color-primary)] px-3.5 py-1.5 text-[13px] font-semibold text-white disabled:opacity-50"
              >
                Изпрати
              </button>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
