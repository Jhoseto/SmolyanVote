"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useVirtualizer } from "@tanstack/react-virtual";
import { EmptyState, ErrorState, Skeleton } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useAuth } from "@/shared/lib/authContext";
import { useConversations } from "../hooks/useConversations";
import { useMessages } from "../hooks/useMessages";
import { useToast } from "@/shared/hooks/useToast";
import { useMarkConversationRead } from "../hooks/useMarkConversationRead";
import { MAX_ATTACHMENT_BYTES, useSendAttachment } from "../hooks/useSendAttachment";
import { PinnedBanner } from "./PinnedBanner";

/** Fired by the command palette when a global search hit is opened. */
const JUMP_EVENT = "sv:messenger-jump";
import { useCallHistory } from "../hooks/useCallHistory";
import { useMessengerUiStore } from "../store/messengerUiStore";
import { formatDayLabel } from "../lib/presence";
import type { CallHistoryItem, Message } from "../types";
import type { GroupPosition } from "./MessageBubble";
import { CallHistoryItem as CallHistoryRow } from "./CallHistoryItem";
import { MessageGroup } from "./MessageGroup";
import { MessageInput } from "./MessageInput";
import { DateSeparator } from "./DateSeparator";
import { TypingBubble } from "./TypingBubble";
import { JumpToLatest } from "./JumpToLatest";
import { E2ESecurityNotice } from "./E2ESecurityNotice";
import { usePeerE2EKey } from "../hooks/useE2EKeys";

interface ChatWindowProps {
  conversationId: number;
  searchOpen?: boolean;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  onCloseSearch?: () => void;
}

type Row =
  | { kind: "date"; id: string; at: number; label: string }
  | { kind: "unread"; id: string; at: number }
  | {
      kind: "message";
      id: string;
      at: number;
      message: Message;
      isOwn: boolean;
      position: GroupPosition;
      showAvatar: boolean;
    }
  | { kind: "call"; id: string; at: number; call: CallHistoryItem };

/** Messages from the same sender within this window collapse into one group. */
const GROUP_WINDOW_MS = 5 * 60 * 1000;

function sameDay(a: number, b: number): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

export function ChatWindow({
  conversationId,
  searchOpen = false,
  searchQuery = "",
  onSearchQueryChange,
  onCloseSearch,
}: ChatWindowProps) {
  const { user } = useAuth();
  const typingByConversation = useMessengerUiStore((s) => s.typingByConversation);
  const { data: conversations } = useConversations();
  const conversation = conversations?.find((c) => c.id === conversationId);
  const other = conversation?.otherUser;
  const { data: peerE2EKey } = usePeerE2EKey(
    conversation?.type !== "GROUP" ? other?.id : null,
  );

  useMarkConversationRead(conversationId);

  const { data, isPending, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useMessages(conversationId);
  const { data: callHistory = [] } = useCallHistory(conversationId);

  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [visibleDay, setVisibleDay] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pendingJump, setPendingJump] = useState<number | null>(null);
  const toast = useToast();
  const { mutate: sendAttachment } = useSendAttachment(conversationId);

  const parentRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const prevLen = useRef(0);
  const unreadAnchor = useRef<number | null>(null);

  const typing = typingByConversation[conversationId] ?? false;

  const messages = useMemo(() => {
    if (!data) return [];
    return [...data.pages].reverse().flatMap((p) => [...p.content].reverse());
  }, [data]);

  /* Frozen once so the divider doesn't jump while the read receipt lands. */
  if (unreadAnchor.current === null && user && messages.length > 0) {
    const firstUnread = messages.find((m) => m.senderId !== user.id && !m.isRead);
    unreadAnchor.current = firstUnread?.id ?? 0;
  }

  const rows = useMemo<Row[]>(() => {
    const query = searchQuery.trim().toLowerCase();
    const visibleMessages = query
      ? messages.filter((m) => m.text.toLowerCase().includes(query))
      : messages;

    const merged: ({ message: Message } | { call: CallHistoryItem })[] = [
      ...visibleMessages.map((message) => ({ message })),
      ...(query ? [] : callHistory.map((call) => ({ call }))),
    ];
    const withTime = merged.map((entry) => ({
      entry,
      at: new Date("message" in entry ? entry.message.sentAt : entry.call.startTime).getTime(),
    }));
    withTime.sort((a, b) => a.at - b.at);

    const result: Row[] = [];
    let previous: { message: Message; at: number } | null = null;
    let unreadInserted = false;

    withTime.forEach(({ entry, at }, index) => {
      if (index === 0 || !sameDay(withTime[index - 1].at, at)) {
        result.push({ kind: "date", id: `d-${at}`, at, label: formatDayLabel(new Date(at).toISOString()) });
        previous = null;
      }

      if (!("message" in entry)) {
        result.push({ kind: "call", id: `c-${entry.call.id}`, at, call: entry.call });
        previous = null;
        return;
      }

      const message = entry.message;
      if (
        !unreadInserted &&
        unreadAnchor.current &&
        message.id === unreadAnchor.current &&
        !query
      ) {
        result.push({ kind: "unread", id: "unread-divider", at });
        unreadInserted = true;
        previous = null;
      }

      const isOwn = message.senderId === user?.id;
      const continues =
        previous !== null &&
        previous.message.senderId === message.senderId &&
        at - previous.at <= GROUP_WINDOW_MS;

      const next = withTime[index + 1];
      const nextMessage = next && "message" in next.entry ? next.entry.message : null;
      const continuesAfter =
        nextMessage !== null &&
        nextMessage.senderId === message.senderId &&
        next.at - at <= GROUP_WINDOW_MS &&
        sameDay(next.at, at) &&
        !(unreadAnchor.current === nextMessage.id && !unreadInserted);

      let position: GroupPosition;
      if (continues && continuesAfter) position = "middle";
      else if (continues) position = "last";
      else if (continuesAfter) position = "first";
      else position = "single";

      result.push({
        kind: "message",
        id: `m-${message.clientId ?? message.id}`,
        at,
        message,
        isOwn,
        position,
        showAvatar: !isOwn && (position === "last" || position === "single"),
      });
      previous = { message, at };
    });

    return result;
  }, [messages, callHistory, searchQuery, user?.id]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 10,
  });

  useEffect(() => {
    if (!stickToBottom.current) return;
    if (rows.length === 0) return;
    if (rows.length !== prevLen.current || typing) {
      virtualizer.scrollToIndex(rows.length - 1, { align: "end" });
    }
    prevLen.current = rows.length;
  }, [rows.length, typing, virtualizer]);

  function onScroll() {
    const el = parentRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottom.current = distance < 100;
    setAtBottom(distance < 400);

    const first = virtualizer.getVirtualItems()[0];
    const row = first ? rows[first.index] : null;
    setVisibleDay(row ? formatDayLabel(new Date(row.at).toISOString()) : null);

    if (el.scrollTop < 80 && hasNextPage && !isFetchingNextPage) {
      const prevHeight = el.scrollHeight;
      void fetchNextPage().then(() => {
        if (parentRef.current) {
          parentRef.current.scrollTop = parentRef.current.scrollHeight - prevHeight;
        }
      });
    }
  }

  function jumpToMessage(messageId: number) {
    const index = rows.findIndex((r) => r.kind === "message" && r.message.id === messageId);
    if (index < 0) return;
    virtualizer.scrollToIndex(index, { align: "center" });
    setHighlightedId(messageId);
    window.setTimeout(() => setHighlightedId(null), 1500);
  }

  useEffect(() => {
    function onJump(event: Event) {
      const detail = (event as CustomEvent<{ conversationId: number; messageId: number }>).detail;
      if (detail?.conversationId !== conversationId) return;
      setPendingJump(detail.messageId);
    }
    window.addEventListener(JUMP_EVENT, onJump);
    return () => window.removeEventListener(JUMP_EVENT, onJump);
  }, [conversationId]);

  /* Search hits can point at a message that is still on an unloaded page. */
  useEffect(() => {
    if (pendingJump == null) return;
    const index = rows.findIndex((r) => r.kind === "message" && r.message.id === pendingJump);
    if (index >= 0) {
      jumpToMessage(pendingJump);
      setPendingJump(null);
    } else if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    } else {
      setPendingJump(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingJump, rows, hasNextPage, isFetchingNextPage]);

  function jumpToLatest() {
    stickToBottom.current = true;
    virtualizer.scrollToIndex(Math.max(0, rows.length - 1), { align: "end" });
  }

  function attachFiles(files: FileList | File[]) {
    for (const file of Array.from(files)) {
      if (file.size > MAX_ATTACHMENT_BYTES) {
        toast.error(`„${file.name}“ е над 20 MB.`);
        continue;
      }
      sendAttachment({ file, parentMessageId: replyTo?.id ?? null });
    }
    setReplyTo(null);
  }

  return (
    <div
      className="relative flex h-full min-h-0 flex-col bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(246,249,247,0.88))]"
      onDragEnter={(e) => {
        if (e.dataTransfer.types.includes("Files")) setDragOver(true);
      }}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) e.preventDefault();
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false);
      }}
      onDrop={(e) => {
        if (!e.dataTransfer.files.length) return;
        e.preventDefault();
        setDragOver(false);
        attachFiles(e.dataTransfer.files);
      }}
    >
      <AnimatePresence>
        {dragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-2 z-30 flex flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border-2 border-dashed border-[color:var(--color-primary)] bg-[color:var(--color-primary-50)]/85"
          >
            <i className="bi bi-cloud-arrow-up text-3xl text-[color:var(--color-primary)]" />
            <p className="text-sm font-semibold text-[color:var(--color-primary)]">
              Пусни, за да изпратиш
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <PinnedBanner conversationId={conversationId} onJumpTo={jumpToMessage} />

      {searchOpen && (
        <div className="shrink-0 border-b border-border-default/50 px-3 py-2">
          <div className="relative">
            <i className="bi bi-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[color:var(--color-text-muted)]" />
            <input
              value={searchQuery}
              onChange={(e) => onSearchQueryChange?.(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && onCloseSearch?.()}
              placeholder="Търси в съобщенията…"
              aria-label="Търси в съобщенията"
              className="w-full rounded-[var(--radius-pill)] border border-border-default/60 bg-white py-1.5 pl-8 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              autoFocus
            />
          </div>
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        <AnimatePresence>
          {visibleDay && !atBottom && (
            <div className="pointer-events-none absolute inset-x-0 top-2 z-10">
              <DateSeparator label={visibleDay} floating />
            </div>
          )}
        </AnimatePresence>

        <div
          ref={parentRef}
          onScroll={onScroll}
          className="sv-scrollbar sv-msg-scroll h-full overflow-y-auto py-2"
          aria-live="polite"
        >
          {isFetchingNextPage && (
            <div className="flex justify-center py-2">
              <Skeleton className="h-6 w-24 rounded-[var(--radius-pill)]" />
            </div>
          )}

          {isPending &&
            Array.from({ length: 6 }, (_, i) => (
              <Skeleton
                key={i}
                className={cn(
                  "mx-3 mb-2 h-12 rounded-[18px]",
                  i % 2 === 0 ? "w-2/3" : "ml-auto mr-3 w-1/2",
                )}
              />
            ))}

          {isError && (
            <ErrorState
              description="Съобщенията не можаха да се заредят."
              onRetry={() => refetch()}
            />
          )}

          {!isPending && !isError && rows.length === 0 && (
            <EmptyState
              icon={searchQuery ? "bi-search" : "bi-chat-heart"}
              title={searchQuery ? "Няма съвпадения" : "Започни разговора"}
              description={
                searchQuery
                  ? "Опитай с друга дума."
                  : `Напиши първото съобщение до ${other?.fullName || other?.username || "събеседника"}.`
              }
            />
          )}

          {!isPending && !isError && rows.length > 0 && (
            <div style={{ height: virtualizer.getTotalSize(), width: "100%", position: "relative" }}>
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index];
                return (
                  <div
                    key={row.id}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {row.kind === "date" && <DateSeparator label={row.label} />}

                    {row.kind === "unread" && (
                      <div className="flex items-center gap-2 px-3 py-2">
                        <span className="sv-msg-brandline flex-1" />
                        <span className="sv-msg-label text-[color:var(--color-primary)]">
                          Нови съобщения
                        </span>
                        <span className="sv-msg-brandline flex-1" />
                      </div>
                    )}

                    {row.kind === "call" && user && (
                      <CallHistoryRow item={row.call} currentUserId={user.id} />
                    )}

                    {row.kind === "message" && (
                      <MessageGroup
                        message={row.message}
                        isOwn={row.isOwn}
                        position={row.position}
                        showAvatar={row.showAvatar}
                        peer={other ?? undefined}
                        showSenderName={conversation?.type === "GROUP"}
                        e2ePeerUserId={other?.id ?? null}
                        searchQuery={searchQuery}
                        highlighted={highlightedId === row.message.id}
                        editing={editingId === row.message.id}
                        onEditingChange={(next) =>
                          setEditingId(next ? row.message.id : null)
                        }
                        onReply={setReplyTo}
                        onJumpTo={jumpToMessage}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <AnimatePresence>{typing && <TypingBubble user={other ?? undefined} />}</AnimatePresence>
        </div>

        <JumpToLatest
          visible={!atBottom && rows.length > 0}
          unread={conversation?.unreadCount ?? 0}
          onClick={jumpToLatest}
        />
      </div>

      {conversation?.type !== "GROUP" && (
        <E2ESecurityNotice
          compact
          active={Boolean(peerE2EKey?.publicJwk)}
          className="border-t border-border-default/40 bg-[color:var(--color-surface-light)]"
        />
      )}

      <MessageInput
        conversationId={conversationId}
        replyTo={replyTo}
        onClearReply={() => setReplyTo(null)}
        onAttach={attachFiles}
        onEditLast={() => {
          const last = [...messages].reverse().find((m) => m.senderId === user?.id && !m.clientId);
          if (!last) return;
          setEditingId(last.id);
          jumpToMessage(last.id);
        }}
      />
    </div>
  );
}
