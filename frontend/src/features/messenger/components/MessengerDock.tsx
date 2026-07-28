"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, Reorder } from "framer-motion";
import { Avatar } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useConversations } from "../hooks/useConversations";
import { useMessengerUiStore } from "../store/messengerUiStore";
import { describeConversation } from "../lib/conversationDisplay";
import { useIsDesktopMessenger } from "../lib/isDesktopMessenger";
import { dockBubbleVariants, springDock } from "../lib/messengerMotion";
import type { Conversation } from "../types";
import { GroupAvatar } from "./GroupAvatar";

const MAX_VISIBLE = 5;

interface DockBubbleProps {
  conversation: Conversation;
  online: boolean;
  typing: boolean;
  onRestore: () => void;
  onClose: () => void;
}

function DockBubble({ conversation, online, typing, onRestore, onClose }: DockBubbleProps) {
  const [hovered, setHovered] = useState(false);
  const display = describeConversation(conversation);
  const name = display.name;
  const unread = conversation.unreadCount;

  /*
   * Row-reverse keeps the avatar pinned to the right edge while the bubble is
   * collapsed. The close button is the last child so it lands on the far left
   * as a real flex item — absolutely positioning it there used to sit on top
   * of the first characters of the name.
   */
  return (
    <motion.div
      layout
      className="sv-msg-dock-bubble flex flex-row-reverse items-center overflow-hidden"
      data-conversation-id={conversation.id}
      data-alert="false"
      animate={{ width: hovered ? 234 : 42 }}
      transition={springDock}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      <button
        type="button"
        onClick={onRestore}
        aria-label={unread > 0 ? `${name} — ${unread} непрочетени` : `Отвори ${name}`}
        className="flex h-full min-w-0 flex-1 flex-row-reverse items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <span className="relative flex h-[42px] w-[42px] shrink-0 items-center justify-center">
          <span className="sv-msg-dock-ring absolute inset-1 rounded-full" aria-hidden />
          {typing ? (
            <span className="flex h-8 w-8 items-center justify-center gap-[3px] rounded-full bg-primary-50">
              <span className="sv-msg-dot" />
              <span className="sv-msg-dot" />
              <span className="sv-msg-dot" />
            </span>
          ) : display.isGroup ? (
            <GroupAvatar
              title={display.name}
              imageUrl={display.imageUrl}
              members={display.members}
              size={32}
            />
          ) : (
            <Avatar username={display.avatarSeed} imageUrl={display.imageUrl} size={32} />
          )}
          {!display.isGroup && (
            <span
              className={cn(
                "absolute bottom-1 right-1 h-2 w-2 rounded-full border-[1.5px] border-white",
                online ? "bg-[color:var(--color-success)]" : "bg-[color:var(--color-text-muted)]",
              )}
            />
          )}
          {unread > 0 && (
            <span className="sv-msg-num absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[color:var(--color-error)] px-1 text-[9px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </span>

        <AnimatePresence>
          {hovered && (
            <motion.span
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.14 }}
              className="min-w-0 flex-1"
            >
              <span className="block truncate font-[family-name:var(--font-display)] text-[12px] font-semibold leading-tight text-[color:var(--color-text-heading)]">
                {name}
              </span>
              <span className="block truncate text-[10.5px] leading-tight text-[color:var(--color-text-secondary)]">
                {typing ? "пише…" : conversation.lastMessage || "Няма съобщения"}
              </span>
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {hovered && (
        <button
          type="button"
          onClick={onClose}
          aria-label={`Затвори ${name}`}
          className="ml-2 mr-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] text-[color:var(--color-text-muted)] transition-colors hover:bg-[color:var(--color-error)] hover:text-white"
        >
          <i className="bi bi-x" />
        </button>
      )}
    </motion.div>
  );
}

/**
 * Vertical rail of minimized conversations, stacked bottom-up right above the
 * FAB. Replaces the old bottom-center taskbar.
 */
export function MessengerDock() {
  const activeChats = useMessengerUiStore((s) => s.activeChats);
  const dockOrder = useMessengerUiStore((s) => s.dockOrder);
  const reorderDock = useMessengerUiStore((s) => s.reorderDock);
  const restoreChat = useMessengerUiStore((s) => s.restoreChat);
  const closeChat = useMessengerUiStore((s) => s.closeChat);
  const onlineByUserId = useMessengerUiStore((s) => s.onlineByUserId);
  const typingByConversation = useMessengerUiStore((s) => s.typingByConversation);
  const { data: conversations } = useConversations();
  const isDesktop = useIsDesktopMessenger();

  const [overflowOpen, setOverflowOpen] = useState(false);
  const previousUnread = useRef<Record<number, number>>({});
  const railRef = useRef<HTMLDivElement>(null);

  const minimizedIds = useMemo(
    () => dockOrder.filter((id) => activeChats.some((c) => c.conversationId === id && c.isMinimized)),
    [dockOrder, activeChats],
  );
  const hasBubbles = isDesktop && minimizedIds.length > 0;

  /* The slot above the FAB is shared with BackToTop — bubbles win. */
  useEffect(() => {
    document.documentElement.classList.toggle("sv-chats-docked", hasBubbles);
    return () => document.documentElement.classList.remove("sv-chats-docked");
  }, [hasBubbles]);

  /**
   * One-shot nudge + ring whenever a docked conversation gains unread.
   * Driven straight through the DOM: it is a fire-and-forget CSS animation,
   * so keeping it in React state would only cause cascading renders.
   */
  useEffect(() => {
    if (!conversations) return;
    const next: Record<number, number> = {};
    const fired: number[] = [];
    for (const conv of conversations) {
      next[conv.id] = conv.unreadCount;
      const before = previousUnread.current[conv.id];
      if (before !== undefined && conv.unreadCount > before) fired.push(conv.id);
    }
    previousUnread.current = next;
    if (fired.length === 0) return;

    const bubbles = fired
      .map((id) => railRef.current?.querySelector<HTMLElement>(`[data-conversation-id="${id}"]`))
      .filter((el): el is HTMLElement => el != null);
    if (bubbles.length === 0) return;

    for (const el of bubbles) el.dataset.alert = "true";
    const timer = window.setTimeout(() => {
      for (const el of bubbles) el.dataset.alert = "false";
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [conversations]);

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    const buttons = Array.from(
      railRef.current?.querySelectorAll<HTMLButtonElement>("button[aria-label]") ?? [],
    );
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (index < 0) return;
    e.preventDefault();
    const step = e.key === "ArrowUp" ? -1 : 1;
    buttons[(index + step + buttons.length) % buttons.length]?.focus();
  }

  if (!hasBubbles) return null;

  const overflowIds = minimizedIds.slice(0, Math.max(0, minimizedIds.length - MAX_VISIBLE));
  const visibleIds = minimizedIds.slice(-MAX_VISIBLE);

  function conversationOf(id: number) {
    return conversations?.find((c) => c.id === id);
  }

  return (
    <div
      ref={railRef}
      role="toolbar"
      aria-label="Минимизирани разговори"
      aria-orientation="vertical"
      onKeyDown={onKeyDown}
      className="sv-msg-dock"
      data-sv-dock-anchor
    >
      {overflowIds.length > 0 && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setOverflowOpen((v) => !v)}
            aria-label={`Още ${overflowIds.length} минимизирани разговора`}
            aria-expanded={overflowOpen}
            className="sv-msg-dock-bubble sv-msg-num flex h-[42px] w-[42px] items-center justify-center text-[12px] font-semibold text-[color:var(--color-text-heading)]"
          >
            +{overflowIds.length}
          </button>

          <AnimatePresence>
            {overflowOpen && (
              <motion.ul
                initial={{ opacity: 0, x: 8, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 8, scale: 0.96 }}
                transition={{ duration: 0.16 }}
                className="sv-msg-surface absolute bottom-0 right-14 w-56 overflow-hidden p-1"
                data-glass="on"
              >
                {overflowIds.map((id) => {
                  const conv = conversationOf(id);
                  if (!conv) return null;
                  const display = describeConversation(conv);
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => {
                          restoreChat(id);
                          setOverflowOpen(false);
                        }}
                        aria-label={`Отвори ${display.name}`}
                        className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left hover:bg-[color:var(--color-surface-light)]"
                      >
                        {display.isGroup ? (
                          <GroupAvatar
                            title={display.name}
                            imageUrl={display.imageUrl}
                            members={display.members}
                            size={28}
                          />
                        ) : (
                          <Avatar
                            username={display.avatarSeed}
                            imageUrl={display.imageUrl}
                            size={28}
                          />
                        )}
                        <span className="min-w-0 flex-1 truncate text-xs font-medium text-[color:var(--color-text-heading)]">
                          {display.name}
                        </span>
                        {conv.unreadCount > 0 && (
                          <span className="sv-msg-num flex h-4 min-w-4 items-center justify-center rounded-full bg-[color:var(--color-error)] px-1 text-[10px] font-bold text-white">
                            {conv.unreadCount}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      )}

      <Reorder.Group
        axis="y"
        values={visibleIds}
        onReorder={(next) => reorderDock([...overflowIds, ...next])}
        className="flex flex-col items-end gap-[var(--sv-rail-gap)]"
      >
        <AnimatePresence initial={false}>
          {visibleIds.map((id) => {
            const conv = conversationOf(id);
            if (!conv) return null;
            const peer = describeConversation(conv).peer;
            return (
              <Reorder.Item
                key={id}
                value={id}
                variants={dockBubbleVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="list-none"
              >
                <DockBubble
                  conversation={conv}
                  online={
                    peer
                      ? (onlineByUserId[peer.id] ?? peer.isOnline ?? false)
                      : false
                  }
                  typing={typingByConversation[conv.id] ?? conv.isTyping}
                  onRestore={() => restoreChat(id)}
                  onClose={() => closeChat(id)}
                />
              </Reorder.Item>
            );
          })}
        </AnimatePresence>
      </Reorder.Group>
    </div>
  );
}
