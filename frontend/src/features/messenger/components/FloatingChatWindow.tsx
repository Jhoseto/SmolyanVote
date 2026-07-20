"use client";

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { cn } from "@/shared/lib/cn";
import { useConversations } from "../hooks/useConversations";
import { useMessengerUiStore } from "../store/messengerUiStore";
import { ChatWindow } from "./ChatWindow";

const WINDOW_W = 400;
const WINDOW_H = 600;

interface FloatingChatWindowProps {
  conversationId: number;
  position: { x: number; y: number };
  zIndex: number;
  isMinimized: boolean;
  onStartCall?: (conversationId: number, isVideo: boolean) => void;
}

/** Draggable multi-chat shell (legacy SVChatWindow port — Фаза 8b). */
export function FloatingChatWindow({
  conversationId,
  position,
  zIndex,
  isMinimized,
  onStartCall,
}: FloatingChatWindowProps) {
  const bringToFront = useMessengerUiStore((s) => s.bringToFront);
  const minimizeChat = useMessengerUiStore((s) => s.minimizeChat);
  const closeChat = useMessengerUiStore((s) => s.closeChat);
  const updateChatPosition = useMessengerUiStore((s) => s.updateChatPosition);
  const { data: conversations } = useConversations();
  const conversation = conversations?.find((c) => c.id === conversationId);
  const title =
    conversation?.otherUser.fullName || conversation?.otherUser.username || "Чат";

  const dragRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!dragging) return;

    function onMove(e: MouseEvent) {
      const d = dragRef.current;
      if (!d) return;
      const x = Math.max(0, Math.min(window.innerWidth - WINDOW_W, d.origX + (e.clientX - d.startX)));
      const y = Math.max(0, Math.min(window.innerHeight - 80, d.origY + (e.clientY - d.startY)));
      updateChatPosition(conversationId, { x, y });
    }

    function onUp() {
      dragRef.current = null;
      setDragging(false);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, conversationId, updateChatPosition]);

  function onHeaderMouseDown(e: ReactMouseEvent) {
    if ((e.target as HTMLElement).closest("button,a")) return;
    bringToFront(conversationId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: position.x,
      origY: position.y,
    };
    setDragging(true);
  }

  return (
    <div
      className={cn(
        "fixed flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border-default/60 bg-white shadow-[var(--shadow-dropdown)]",
        isMinimized && "pointer-events-none invisible",
        dragging && "select-none",
      )}
      style={{
        left: position.x,
        top: position.y,
        width: WINDOW_W,
        height: WINDOW_H,
        zIndex,
        display: isMinimized ? "none" : "flex",
      }}
      onMouseDown={() => bringToFront(conversationId)}
    >
      <div
        className="flex cursor-grab items-center gap-2 border-b border-border-default/60 bg-[image:var(--gradient-primary)] px-3 py-1.5 text-white active:cursor-grabbing"
        onMouseDown={onHeaderMouseDown}
      >
        <p className="min-w-0 flex-1 truncate text-xs font-semibold">{title}</p>
        <button
          type="button"
          onClick={() => minimizeChat(conversationId)}
          aria-label="Минимизирай"
          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/15"
        >
          <i className="bi bi-dash-lg" />
        </button>
        <button
          type="button"
          onClick={() => closeChat(conversationId)}
          aria-label="Затвори"
          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/15"
        >
          <i className="bi bi-x-lg text-sm" />
        </button>
      </div>

      <div className="min-h-0 flex-1">
        <ChatWindow
          conversationId={conversationId}
          onStartCall={
            onStartCall ? (isVideo) => onStartCall(conversationId, isVideo) : undefined
          }
        />
      </div>
    </div>
  );
}
