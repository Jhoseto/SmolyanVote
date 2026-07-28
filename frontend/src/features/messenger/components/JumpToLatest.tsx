"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/shared/lib/cn";
import { springDock } from "../lib/messengerMotion";

interface JumpToLatestProps {
  visible: boolean;
  unread: number;
  onClick: () => void;
}

/** "Към последните" pill, shown once the reader scrolls away from the bottom. */
export function JumpToLatest({ visible, unread, onClick }: JumpToLatestProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={onClick}
          initial={{ opacity: 0, y: 10, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.94 }}
          transition={springDock}
          className={cn(
            "absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5",
            "rounded-[var(--radius-pill)] bg-white px-3 py-1.5 text-xs font-semibold",
            "text-[color:var(--color-text-heading)] shadow-[var(--shadow-md)] ring-1 ring-border-default/60",
            "hover:text-[color:var(--color-primary)]",
          )}
        >
          <i className="bi bi-arrow-down text-[11px]" />
          Към последните
          {unread > 0 && (
            <span className="sv-msg-num flex h-4 min-w-4 items-center justify-center rounded-full bg-[color:var(--color-error)] px-1 text-[10px] text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </motion.button>
      )}
    </AnimatePresence>
  );
}
