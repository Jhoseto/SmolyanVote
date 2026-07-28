"use client";

import { useEffect } from "react";
import { useMessengerUiStore } from "../store/messengerUiStore";

/** Fired at the focused window so it can open its own search field. */
export const SEARCH_EVENT = "sv:messenger-search";

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
}

/** Global desktop keyboard layer (MODERN_FRONTEND_PLAN — Фаза 8b). */
export function useMessengerShortcuts(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(e: KeyboardEvent) {
      const store = useMessengerUiStore.getState();
      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        store.setCommandPaletteOpen(!store.commandPaletteOpen);
        return;
      }

      if (mod && e.key.toLowerCase() === "f" && store.focusedConversationId != null) {
        e.preventDefault();
        window.dispatchEvent(
          new CustomEvent(SEARCH_EVENT, { detail: { conversationId: store.focusedConversationId } }),
        );
        return;
      }

      if (mod && (e.key === "`" || e.code === "Backquote")) {
        e.preventDefault();
        store.focusNextWindow(e.shiftKey);
        return;
      }

      if (e.key === "Escape" && !isTypingTarget(e.target)) {
        if (store.commandPaletteOpen) return; // the dialog handles its own Esc
        if (store.quickReply) {
          store.setQuickReply(null);
          return;
        }
        if (store.panelOpen) {
          store.closePanel();
          return;
        }
        if (store.focusedConversationId != null) {
          store.closeChat(store.focusedConversationId);
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
