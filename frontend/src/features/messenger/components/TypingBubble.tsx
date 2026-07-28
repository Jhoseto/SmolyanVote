"use client";

import { motion } from "framer-motion";
import { Avatar } from "@/shared/ui";
import { easeOutQuart } from "../lib/messengerMotion";
import type { MessengerUser } from "../types";

/** Skeleton bubble with animated dots — replaces "пише…" text in the header. */
export function TypingBubble({ user }: { user: MessengerUser | undefined }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.18, ease: easeOutQuart }}
      className="flex items-end gap-2 px-3 pb-2"
      aria-live="polite"
      aria-label={`${user?.fullName || user?.username || "Събеседникът"} пише`}
    >
      <Avatar username={user?.username ?? "?"} imageUrl={user?.imageUrl ?? null} size={26} />
      <span className="sv-msg-bubble-peer flex items-center gap-1 rounded-[18px] rounded-bl-[6px] px-3.5 py-3">
        <span className="sv-msg-dot" />
        <span className="sv-msg-dot" />
        <span className="sv-msg-dot" />
      </span>
    </motion.div>
  );
}
