"use client";

import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { Avatar, EmptyState, LogoLoader } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useAuth } from "@/shared/lib/authContext";
import { formatRelativeDate } from "@/shared/lib/formatRelativeDate";
import { messengerApi } from "../api";
import { callHistoryQueryKey } from "../hooks/useCallHistory";
import { useConversations } from "../hooks/useConversations";
import { describeConversation } from "../lib/conversationDisplay";
import { useMessengerUiStore } from "../store/messengerUiStore";
import type { CallHistoryItem, Conversation } from "../types";
import { GroupAvatar } from "./GroupAvatar";

function duration(seconds: number | null): string {
  if (seconds == null) return "";
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/**
 * Cross-conversation call log. The backend only exposes per-conversation
 * history, so the tab fans out over the loaded conversations on demand.
 */
export function CallsList() {
  const { user } = useAuth();
  const { data: conversations = [], isPending: loadingConversations } = useConversations();
  const openChat = useMessengerUiStore((s) => s.openChat);

  const results = useQueries({
    queries: conversations
      .filter((c) => c.type !== "GROUP")
      .map((c) => ({
        queryKey: callHistoryQueryKey(c.id),
        queryFn: () => messengerApi.callHistory(c.id),
        staleTime: 60_000,
      })),
  });

  const loading = loadingConversations || results.some((r) => r.isPending);

  const directConversations = useMemo(
    () => conversations.filter((c) => c.type !== "GROUP"),
    [conversations],
  );

  const calls = useMemo(() => {
    const rows: { call: CallHistoryItem; conversation: Conversation }[] = [];
    results.forEach((result, index) => {
      const conversation = directConversations[index];
      if (!conversation || !result.data) return;
      for (const call of result.data) rows.push({ call, conversation });
    });
    rows.sort((a, b) => new Date(b.call.startTime).getTime() - new Date(a.call.startTime).getTime());
    return rows.slice(0, 60);
  }, [results, directConversations]);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <LogoLoader size="sm" label="Зареждане…" />
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <EmptyState
        icon="bi-telephone"
        title="Няма обаждания"
        description="Историята на разговорите ще се появи тук."
      />
    );
  }

  return (
    <ul className="sv-scrollbar h-full overflow-y-auto py-1">
      {calls.map(({ call, conversation }) => {
        const incoming = call.receiverId === user?.id;
        const failed = call.status === "MISSED" || call.status === "REJECTED";
        const display = describeConversation(conversation);

        return (
          <li key={`${conversation.id}-${call.id}`}>
            <button
              type="button"
              onClick={() => openChat(conversation.id)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[color:var(--color-surface-light)]"
            >
              {display.isGroup ? (
                <GroupAvatar
                  title={display.name}
                  imageUrl={display.imageUrl}
                  members={display.members}
                  size={40}
                />
              ) : (
                <Avatar username={display.avatarSeed} imageUrl={display.imageUrl} size={40} />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-[family-name:var(--font-display)] text-sm font-semibold text-[color:var(--color-text-heading)]">
                  {display.name}
                </p>
                <p
                  className={cn(
                    "flex items-center gap-1.5 text-xs",
                    failed
                      ? "text-[color:var(--color-error)]"
                      : "text-[color:var(--color-text-secondary)]",
                  )}
                >
                  <i
                    className={cn(
                      "bi",
                      incoming ? "bi-arrow-down-left" : "bi-arrow-up-right",
                      call.isVideoCall && "bi-camera-video",
                    )}
                  />
                  {incoming ? "Входящо" : "Изходящо"}
                  {call.durationSeconds != null && (
                    <span className="sv-msg-num">· {duration(call.durationSeconds)}</span>
                  )}
                </p>
              </div>
              <span className="sv-msg-num shrink-0 text-[10px] text-[color:var(--color-text-muted)]">
                {formatRelativeDate(call.startTime)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
