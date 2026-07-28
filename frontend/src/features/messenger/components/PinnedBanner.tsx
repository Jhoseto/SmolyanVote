"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/shared/lib/cn";
import { usePinnedMessages } from "../hooks/useMessageActions";
import { easeOutQuart } from "../lib/messengerMotion";

/** Collapsed strip above the timeline listing this chat's pinned messages. */
export function PinnedBanner({
  conversationId,
  onJumpTo,
}: {
  conversationId: number;
  onJumpTo: (messageId: number) => void;
}) {
  const { data: pinned = [] } = usePinnedMessages(conversationId);
  const [expanded, setExpanded] = useState(false);

  if (pinned.length === 0) return null;
  const preview = pinned[0];

  return (
    <div className="shrink-0 border-b border-border-default/40 bg-[color:var(--color-primary-50)]/70 backdrop-blur-sm">
      <button
        type="button"
        onClick={() => (pinned.length > 1 ? setExpanded((v) => !v) : onJumpTo(preview.id))}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left"
      >
        <i className="bi bi-pin-angle-fill shrink-0 text-[11px] text-[color:var(--color-primary)]" />
        <span className="min-w-0 flex-1 truncate text-[11px] text-[color:var(--color-text-secondary)]">
          {preview.text || preview.attachmentName || "Прикачен файл"}
        </span>
        {pinned.length > 1 && (
          <span className="sv-msg-num shrink-0 text-[10px] text-[color:var(--color-text-muted)]">
            {pinned.length}
            <i className={cn("bi ml-1", expanded ? "bi-chevron-up" : "bi-chevron-down")} />
          </span>
        )}
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: easeOutQuart }}
            className="overflow-hidden"
          >
            {pinned.map((message) => (
              <li key={message.id}>
                <button
                  type="button"
                  onClick={() => {
                    onJumpTo(message.id);
                    setExpanded(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[11px] hover:bg-white/60"
                >
                  <span className="truncate">
                    {message.text || message.attachmentName || "Прикачен файл"}
                  </span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
