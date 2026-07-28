"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar } from "@/shared/ui";
import { useMessengerUiStore } from "../store/messengerUiStore";
import { useIsDesktopMessenger } from "../lib/isDesktopMessenger";
import { useSendMessage } from "../hooks/useSendMessage";
import { springDock } from "../lib/messengerMotion";

const DISMISS_MS = 9000;

function QuickReplyCard({
  conversationId,
  senderName,
  senderAvatar,
  text,
  onDismiss,
}: {
  conversationId: number;
  senderName: string;
  senderAvatar: string | null;
  text: string;
  onDismiss: () => void;
}) {
  const [reply, setReply] = useState("");
  const openChat = useMessengerUiStore((s) => s.openChat);
  const { mutate: send, isPending } = useSendMessage(conversationId);

  function submit() {
    const trimmed = reply.trim();
    if (!trimmed || isPending) return;
    send({ text: trimmed });
    setReply("");
    onDismiss();
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.96 }}
      transition={springDock}
      className="sv-msg-surface relative w-[320px] overflow-hidden p-3"
      data-glass="on"
      role="alert"
    >
      <div className="flex items-start gap-2.5">
        <Avatar username={senderName} imageUrl={senderAvatar} size={36} />
        <button
          type="button"
          onClick={() => {
            openChat(conversationId);
            onDismiss();
          }}
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate font-[family-name:var(--font-display)] text-sm font-semibold text-[color:var(--color-text-heading)]">
            {senderName}
          </p>
          <p className="line-clamp-2 text-xs text-[color:var(--color-text-secondary)]">{text}</p>
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Скрий известието"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[color:var(--color-text-muted)] hover:bg-white hover:text-[color:var(--color-error)]"
        >
          <i className="bi bi-x" />
        </button>
      </div>

      <div className="mt-2.5 flex items-center gap-2">
        <input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") onDismiss();
          }}
          placeholder="Бърз отговор…"
          aria-label={`Бърз отговор до ${senderName}`}
          className="min-w-0 flex-1 rounded-[var(--radius-pill)] border border-border-default/60 bg-white px-3 py-1.5 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!reply.trim() || isPending}
          aria-label="Изпрати отговора"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[image:var(--gradient-primary)] text-white disabled:opacity-40"
        >
          <i className="bi bi-send-fill text-xs" />
        </button>
      </div>
    </motion.div>
  );
}

/** Inline reply prompt for messages arriving in a conversation that isn't open. */
export function QuickReplyToast() {
  const quickReply = useMessengerUiStore((s) => s.quickReply);
  const setQuickReply = useMessengerUiStore((s) => s.setQuickReply);
  const isDesktop = useIsDesktopMessenger();

  useEffect(() => {
    if (!quickReply) return;
    const timer = window.setTimeout(() => setQuickReply(null), DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [quickReply, setQuickReply]);

  return (
    <div className="pointer-events-none fixed right-[var(--sv-rail-right)] top-24 z-[1080] flex flex-col items-end gap-2">
      <AnimatePresence>
        {isDesktop && quickReply && (
          <div key={quickReply.receivedAt} className="pointer-events-auto">
            <QuickReplyCard
              conversationId={quickReply.conversationId}
              senderName={quickReply.senderName}
              senderAvatar={quickReply.senderAvatar}
              text={quickReply.text}
              onDismiss={() => setQuickReply(null)}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
