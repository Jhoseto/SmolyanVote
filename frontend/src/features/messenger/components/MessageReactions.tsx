"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/shared/lib/cn";
import { springReaction } from "../lib/messengerMotion";
import type { ReactionSummary } from "../types";

export const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"] as const;

/** Hover rail with the six one-tap emoji. */
export function ReactionPicker({
  isOwn,
  onPick,
}: {
  isOwn: boolean;
  onPick: (emoji: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.96 }}
      transition={springReaction}
      className={cn(
        "sv-msg-surface absolute -top-8 z-20 flex items-center gap-0.5 px-1.5 py-1",
        isOwn ? "right-0" : "left-0",
      )}
    >
      {QUICK_REACTIONS.map((emoji, index) => (
        <motion.button
          key={emoji}
          type="button"
          onClick={() => onPick(emoji)}
          aria-label={`Реагирай с ${emoji}`}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...springReaction, delay: index * 0.025 }}
          whileHover={{ scale: 1.35, y: -2 }}
          whileTap={{ scale: 0.9 }}
          className="flex h-7 w-7 items-center justify-center rounded-full text-base leading-none"
        >
          {emoji}
        </motion.button>
      ))}
    </motion.div>
  );
}

/** Chips that sit just under the bubble, overlapping it slightly. */
export function ReactionChips({
  reactions,
  isOwn,
  onToggle,
}: {
  reactions: ReactionSummary[];
  isOwn: boolean;
  onToggle: (emoji: string) => void;
}) {
  if (reactions.length === 0) return null;

  return (
    <div className={cn("-mt-1.5 flex flex-wrap gap-1", isOwn ? "justify-end" : "justify-start")}>
      <AnimatePresence initial={false}>
        {reactions.map((reaction) => (
          <motion.button
            key={reaction.emoji}
            type="button"
            layout
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={springReaction}
            onClick={() => onToggle(reaction.emoji)}
            title={reaction.usernames.join(", ")}
            className={cn(
              "flex items-center gap-1 rounded-[var(--radius-pill)] border bg-white px-1.5 py-0.5 text-[11px] shadow-[var(--shadow-xs)]",
              reaction.reactedByMe
                ? "border-[color:var(--color-primary)] bg-[color:var(--color-primary-50)]"
                : "border-border-default/60",
            )}
          >
            <span className="leading-none">{reaction.emoji}</span>
            {reaction.count > 1 && (
              <span className="sv-msg-num font-semibold text-[color:var(--color-text-secondary)]">
                {reaction.count}
              </span>
            )}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
