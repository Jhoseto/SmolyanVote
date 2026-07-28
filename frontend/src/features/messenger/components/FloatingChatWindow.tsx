"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { motion } from "framer-motion";
import { cn } from "@/shared/lib/cn";
import { useAuth } from "@/shared/lib/authContext";
import { useConversations } from "../hooks/useConversations";
import { useToggleMute } from "../hooks/useToggleMute";
import { SEARCH_EVENT } from "../hooks/useMessengerShortcuts";
import { useMessengerUiStore } from "../store/messengerUiStore";
import { springWindow, easeOutQuart } from "../lib/messengerMotion";
import { fullscreenRect, windowSize } from "../lib/windowGeometry";
import { describeConversation, summariseMembers } from "../lib/conversationDisplay";
import type { ActiveChatWindow } from "../types";
import { ChatWindow } from "./ChatWindow";
import { WindowChrome } from "./WindowChrome";
import { ContactSidebar } from "./ContactSidebar";

interface FloatingChatWindowProps {
  chat: ActiveChatWindow;
  onStartCall?: (conversationId: number, isVideo: boolean) => void;
}

/** Where a minimized window flies to — the dock rail, or the FAB if empty. */
function dockTarget(): { x: number; y: number } {
  if (typeof document !== "undefined") {
    const dock = document.querySelector("[data-sv-dock-anchor]");
    if (dock) {
      const rect = dock.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
  }
  return { x: window.innerWidth - 52, y: window.innerHeight - 52 };
}

/**
 * A chat card with one fixed footprint plus a fullscreen state. Dragging only
 * moves it; there is no manual resize, so every open window stays on the same
 * grid and the layout inside can be tuned for exactly two widths.
 */
export function FloatingChatWindow({ chat, onStartCall }: FloatingChatWindowProps) {
  const { conversationId, position, isMinimized, maximized, zIndex } = chat;

  const bringToFront = useMessengerUiStore((s) => s.bringToFront);
  const minimizeChat = useMessengerUiStore((s) => s.minimizeChat);
  const closeChat = useMessengerUiStore((s) => s.closeChat);
  const updateChatPosition = useMessengerUiStore((s) => s.updateChatPosition);
  const toggleMaximize = useMessengerUiStore((s) => s.toggleMaximize);
  const focusedConversationId = useMessengerUiStore((s) => s.focusedConversationId);
  const typingByConversation = useMessengerUiStore((s) => s.typingByConversation);
  const onlineByUserId = useMessengerUiStore((s) => s.onlineByUserId);

  const { data: conversations } = useConversations();
  const { user: currentUser } = useAuth();
  const conversation = conversations?.find((c) => c.id === conversationId);
  const display = describeConversation(conversation);
  const other = display.peer ?? undefined;
  const { mutate: toggleMute } = useToggleMute();

  const focused = focusedConversationId === conversationId;
  const online = other ? (onlineByUserId[other.id] ?? other.isOnline ?? false) : false;
  const typing = typingByConversation[conversationId] ?? false;

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    function onSearchShortcut(event: Event) {
      const detail = (event as CustomEvent<{ conversationId: number }>).detail;
      if (detail?.conversationId !== conversationId) return;
      setSearchOpen(true);
    }
    window.addEventListener(SEARCH_EVENT, onSearchShortcut);
    return () => window.removeEventListener(SEARCH_EVENT, onSearchShortcut);
  }, [conversationId]);

  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  useEffect(() => {
    if (!dragging) return;

    function onMove(e: PointerEvent) {
      const d = dragRef.current;
      if (!d) return;
      updateChatPosition(conversationId, {
        x: d.origX + (e.clientX - d.startX),
        y: d.origY + (e.clientY - d.startY),
      });
    }

    function onUp() {
      dragRef.current = null;
      setDragging(false);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging, conversationId, updateChatPosition]);

  const onChromePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest("button,a,input")) return;
      bringToFront(conversationId);
      if (maximized) return;
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: position.x,
        origY: position.y,
      };
      setDragging(true);
    },
    [bringToFront, conversationId, maximized, position.x, position.y],
  );

  const card = windowSize(sidebarOpen);
  const full = fullscreenRect();
  const geometry = maximized
    ? full
    : { x: position.x, y: position.y, w: card.w, h: card.h };

  const target = isMinimized ? dockTarget() : null;
  const minimizeAnimation = target
    ? {
        opacity: 0,
        scale: 0.1,
        x: target.x - (geometry.x + geometry.w / 2),
        y: target.y - (geometry.y + geometry.h / 2),
      }
    : { opacity: 1, scale: 1, x: 0, y: 0 };

  const title = display.name;

  return (
    /*
     * The outer shell owns geometry and is moved with a compositor-only
     * transform, so a drag never touches layout. The inner motion element
     * only ever animates opacity/scale (open + minimize).
     */
    <div
      className="sv-msg-window-shell fixed left-0 top-0"
      data-dragging={dragging}
      style={{
        zIndex,
        width: geometry.w,
        height: geometry.h,
        transform: `translate3d(${geometry.x}px, ${geometry.y}px, 0)`,
      }}
    >
      <motion.div
        role="dialog"
        aria-label={display.isGroup ? title : `Разговор с ${title}`}
        aria-hidden={isMinimized}
        className={cn(
          "sv-msg-surface sv-msg-window flex h-full w-full flex-col overflow-hidden",
          dragging && "select-none",
          isMinimized && "pointer-events-none",
        )}
        data-focused={focused}
        data-dragging={dragging}
        data-fullscreen={maximized}
        data-glass={focused ? "on" : "off"}
        style={{ transformOrigin: "center center" }}
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={minimizeAnimation}
        transition={isMinimized ? { duration: 0.18, ease: easeOutQuart } : springWindow}
        onPointerDown={() => bringToFront(conversationId)}
      >
        <WindowChrome
          user={other}
          group={
            display.isGroup
              ? {
                  title: display.name,
                  imageUrl: display.imageUrl,
                  members: display.members,
                  subtitle: `${display.members.length} участници · ${summariseMembers(display.members, currentUser?.id)}`,
                }
              : undefined
          }
          online={online}
          typing={typing}
          focused={focused}
          maximized={maximized}
          searchOpen={searchOpen}
          sidebarOpen={sidebarOpen}
          muted={conversation?.isMuted ?? false}
          onToggleMute={() => toggleMute(conversationId)}
          onPointerDown={onChromePointerDown}
          onDoubleClick={() => toggleMaximize(conversationId)}
          onToggleSearch={() => {
            setSearchOpen((v) => !v);
            if (searchOpen) setSearchQuery("");
          }}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          onStartCall={
            onStartCall && !display.isGroup
              ? (isVideo) => onStartCall(conversationId, isVideo)
              : undefined
          }
          onMinimize={() => minimizeChat(conversationId)}
          onToggleMaximize={() => toggleMaximize(conversationId)}
          onClose={() => closeChat(conversationId)}
        />

        <div className="flex min-h-0 flex-1">
          <div className="min-w-0 flex-1">
            <ChatWindow
              conversationId={conversationId}
              searchOpen={searchOpen}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              onCloseSearch={() => {
                setSearchOpen(false);
                setSearchQuery("");
              }}
            />
          </div>
          <ContactSidebar
            open={sidebarOpen}
            conversationId={conversationId}
            conversation={conversation}
            user={other}
            online={online}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
      </motion.div>
    </div>
  );
}
