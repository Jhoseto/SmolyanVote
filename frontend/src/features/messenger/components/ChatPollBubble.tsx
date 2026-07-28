"use client";

import { motion } from "framer-motion";
import { cn } from "@/shared/lib/cn";
import { useVotePoll } from "../hooks/usePolls";
import { easeOutQuart } from "../lib/messengerMotion";
import type { Poll } from "../types";

/** In-chat quick poll with live results. */
export function ChatPollBubble({
  poll,
  conversationId,
  messageId,
  isOwn,
}: {
  poll: Poll;
  conversationId: number;
  messageId: number;
  isOwn: boolean;
}) {
  const vote = useVotePoll(conversationId, messageId);
  const voted = poll.myOptionId != null;

  return (
    <div className="min-w-[240px]">
      <p className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold">
        <i className="bi bi-bar-chart-fill text-[11px] opacity-70" />
        {poll.question}
      </p>

      <div className="flex flex-col gap-1.5">
        {poll.options.map((option) => {
          const share = poll.totalVotes > 0 ? (option.votes / poll.totalVotes) * 100 : 0;
          const mine = poll.myOptionId === option.id;

          return (
            <button
              key={option.id}
              type="button"
              disabled={vote.isPending}
              onClick={() => vote.mutate(option.id)}
              className={cn(
                "relative overflow-hidden rounded-[var(--radius-sm)] px-2.5 py-1.5 text-left text-[12px]",
                isOwn ? "bg-white/15 hover:bg-white/25" : "bg-[color:var(--color-surface-light)] hover:bg-white",
                mine && (isOwn ? "ring-1 ring-white/70" : "ring-1 ring-[color:var(--color-primary)]"),
              )}
            >
              {voted && (
                <motion.span
                  aria-hidden
                  initial={{ width: 0 }}
                  animate={{ width: `${share}%` }}
                  transition={{ duration: 0.45, ease: easeOutQuart }}
                  className={cn(
                    "absolute inset-y-0 left-0",
                    isOwn ? "bg-white/20" : "bg-[color:var(--color-primary-50)]",
                  )}
                />
              )}
              <span className="relative flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5">
                  {mine && <i className="bi bi-check-circle-fill shrink-0 text-[10px]" />}
                  <span className="truncate">{option.text}</span>
                </span>
                {voted && (
                  <span className="sv-msg-num shrink-0 text-[11px] opacity-80">
                    {Math.round(share)}%
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <p className={cn("sv-msg-num mt-1.5 text-[10px]", isOwn ? "text-white/70" : "text-[color:var(--color-text-muted)]")}>
        {poll.totalVotes === 0
          ? "Още никой не е гласувал"
          : `${poll.totalVotes} ${poll.totalVotes === 1 ? "глас" : "гласа"}`}
      </p>
    </div>
  );
}
