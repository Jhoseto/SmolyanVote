"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Avatar, EmptyState, ErrorState, Skeleton } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useAuth } from "@/shared/lib/authContext";
import { useConversations } from "../hooks/useConversations";
import { useMessages } from "../hooks/useMessages";
import { useMarkConversationRead } from "../hooks/useMarkConversationRead";
import { useCallHistory } from "../hooks/useCallHistory";
import { useMessengerUiStore } from "../store/messengerUiStore";
import type { CallHistoryItem, Message } from "../types";
import { CallHistoryItem as CallHistoryRow } from "./CallHistoryItem";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";

interface ChatWindowProps {
  conversationId: number;
  onStartCall?: (isVideo: boolean) => void;
}

type TimelineItem =
  | { kind: "message"; id: string; at: number; message: Message }
  | { kind: "call"; id: string; at: number; call: CallHistoryItem };

export function ChatWindow({ conversationId, onStartCall }: ChatWindowProps) {
  const { user } = useAuth();
  const typingByConversation = useMessengerUiStore((s) => s.typingByConversation);
  const onlineByUserId = useMessengerUiStore((s) => s.onlineByUserId);
  const { data: conversations } = useConversations();
  const conversation = conversations?.find((c) => c.id === conversationId);

  useMarkConversationRead(conversationId);

  const { data, isPending, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useMessages(conversationId);
  const { data: callHistory = [] } = useCallHistory(conversationId);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const parentRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const prevLen = useRef(0);

  const messages = useMemo(() => {
    if (!data) return [];
    return [...data.pages].reverse().flatMap((p) => [...p.content].reverse());
  }, [data]);

  const timeline = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [
      ...messages.map((m) => ({
        kind: "message" as const,
        id: `m-${m.id}`,
        at: new Date(m.sentAt).getTime(),
        message: m,
      })),
      ...callHistory.map((c) => ({
        kind: "call" as const,
        id: `c-${c.id}`,
        at: new Date(c.startTime).getTime(),
        call: c,
      })),
    ];
    items.sort((a, b) => a.at - b.at);
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (i) => i.kind === "call" || i.message.text.toLowerCase().includes(q),
    );
  }, [messages, callHistory, searchQuery]);

  const virtualizer = useVirtualizer({
    count: timeline.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 8,
  });

  const other = conversation?.otherUser;
  const online = other ? (onlineByUserId[other.id] ?? other.isOnline ?? false) : false;
  const typing = typingByConversation[conversationId] ?? false;

  useEffect(() => {
    if (!stickToBottom.current) return;
    if (timeline.length === 0) return;
    if (timeline.length !== prevLen.current || typing) {
      virtualizer.scrollToIndex(timeline.length - 1, { align: "end" });
    }
    prevLen.current = timeline.length;
  }, [timeline.length, typing, virtualizer]);

  function onScroll() {
    const el = parentRef.current;
    if (!el) return;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    if (el.scrollTop < 80 && hasNextPage && !isFetchingNextPage) {
      const prevHeight = el.scrollHeight;
      void fetchNextPage().then(() => {
        if (parentRef.current) {
          parentRef.current.scrollTop = parentRef.current.scrollHeight - prevHeight;
        }
      });
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border-default/60 px-3 py-2">
        {other ? (
          <Link href={`/user/${other.username}`} className="flex min-w-0 flex-1 items-center gap-2">
            <div className="relative shrink-0">
              <Avatar username={other.username} imageUrl={other.imageUrl} size={32} />
              <span
                className={cn(
                  "absolute bottom-0 right-0 h-2 w-2 rounded-full border border-white",
                  online ? "bg-[color:var(--color-success)]" : "bg-[color:var(--color-text-muted)]",
                )}
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[color:var(--color-text-heading)]">
                {other.fullName || other.username}
              </p>
              <p className="text-[11px] text-[color:var(--color-text-muted)]">
                {typing ? "пише…" : online ? "онлайн" : "офлайн"}
              </p>
            </div>
          </Link>
        ) : (
          <Skeleton className="h-9 flex-1 rounded-[var(--radius-md)]" />
        )}

        <button
          type="button"
          onClick={() => setSearchOpen((v) => !v)}
          aria-label="Търсене в чата"
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full",
            searchOpen
              ? "bg-primary-50 text-primary"
              : "text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-muted)]",
          )}
        >
          <i className="bi bi-search text-sm" />
        </button>

        {onStartCall && (
          <>
            <button
              type="button"
              onClick={() => onStartCall(false)}
              aria-label="Аудио обаждане"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-muted)] hover:text-primary"
            >
              <i className="bi bi-telephone text-sm" />
            </button>
            <button
              type="button"
              onClick={() => onStartCall(true)}
              aria-label="Видео обаждане"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-muted)] hover:text-primary"
            >
              <i className="bi bi-camera-video text-sm" />
            </button>
          </>
        )}
      </div>

      {searchOpen && (
        <div className="border-b border-border-default/60 px-3 py-2">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Търси в съобщенията…"
            className="w-full rounded-[var(--radius-md)] border border-border-default/60 px-3 py-1.5 text-sm outline-none focus:border-primary"
            autoFocus
          />
        </div>
      )}

      <div ref={parentRef} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        {isFetchingNextPage && (
          <div className="flex justify-center py-2">
            <Skeleton className="h-6 w-24 rounded-[var(--radius-pill)]" />
          </div>
        )}

        {isPending &&
          Array.from({ length: 6 }, (_, i) => (
            <Skeleton
              key={i}
              className={cn("mb-2 h-12 w-2/3 rounded-[var(--radius-md)]", i % 2 === 0 ? "ml-0" : "ml-auto")}
            />
          ))}

        {isError && <ErrorState description="Съобщенията не можаха да се заредят." onRetry={() => refetch()} />}

        {!isPending && !isError && timeline.length === 0 && (
          <EmptyState icon="bi-chat" title="Няма съобщения" description="Напиши първото съобщение по-долу." />
        )}

        {!isPending && !isError && timeline.length > 0 && (
          <div
            style={{
              height: virtualizer.getTotalSize(),
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((row) => {
              const item = timeline[row.index];
              return (
                <div
                  key={item.id}
                  data-index={row.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${row.start}px)`,
                  }}
                  className="pb-2"
                >
                  {item.kind === "message" ? (
                    <MessageBubble
                      message={item.message}
                      isOwn={item.message.senderId === user?.id}
                      searchQuery={searchQuery}
                      onReply={setReplyTo}
                    />
                  ) : user ? (
                    <CallHistoryRow item={item.call} currentUserId={user.id} />
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <MessageInput
        conversationId={conversationId}
        replyTo={replyTo}
        onClearReply={() => setReplyTo(null)}
      />
    </div>
  );
}
