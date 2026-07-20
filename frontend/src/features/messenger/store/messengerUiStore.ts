import { create } from "zustand";
import type { ActiveChatWindow } from "../types";

type PanelView = "list" | "search";

const WINDOW_W = 400;
const WINDOW_H = 600;

function initialPosition(openCount: number): { x: number; y: number } {
  if (typeof window === "undefined") return { x: 80, y: 80 };
  const cx = Math.max(20, (window.innerWidth - WINDOW_W) / 2);
  const cy = Math.max(20, (window.innerHeight - WINDOW_H) / 2);
  return {
    x: Math.min(cx + openCount * 30, window.innerWidth - WINDOW_W - 20),
    y: Math.min(cy + openCount * 30, window.innerHeight - WINDOW_H - 20),
  };
}

interface MessengerUiState {
  panelOpen: boolean;
  panelView: PanelView;
  downloadModalOpen: boolean;
  activeChats: ActiveChatWindow[];
  nextZIndex: number;
  /** conversationId → peer is typing */
  typingByConversation: Record<number, boolean>;
  /** userId → online */
  onlineByUserId: Record<number, boolean>;
  /** focused conversation for typing subscribe + unread clear */
  focusedConversationId: number | null;

  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  showList: () => void;
  showSearch: () => void;
  setDownloadModalOpen: (open: boolean) => void;

  openChat: (conversationId: number) => void;
  closeChat: (conversationId: number) => void;
  minimizeChat: (conversationId: number) => void;
  restoreChat: (conversationId: number) => void;
  bringToFront: (conversationId: number) => void;
  updateChatPosition: (conversationId: number, position: { x: number; y: number }) => void;

  setTyping: (conversationId: number, isTyping: boolean) => void;
  setOnline: (userId: number, isOnline: boolean) => void;
}

/**
 * Floating messenger shell state — multi-chat windows + list/search panel
 * (MODERN_FRONTEND_PLAN.md Фаза 8b). Message data stays in TanStack Query.
 */
export const useMessengerUiStore = create<MessengerUiState>((set, get) => ({
  panelOpen: false,
  panelView: "list",
  downloadModalOpen: false,
  activeChats: [],
  nextZIndex: 1000,
  typingByConversation: {},
  onlineByUserId: {},
  focusedConversationId: null,

  openPanel: () => set({ panelOpen: true, panelView: "list" }),
  closePanel: () => set({ panelOpen: false, panelView: "list" }),
  togglePanel: () =>
    set((s) =>
      s.panelOpen ? { panelOpen: false, panelView: "list" as const } : { panelOpen: true, panelView: "list" as const },
    ),
  showList: () => set({ panelOpen: true, panelView: "list" }),
  showSearch: () => set({ panelOpen: true, panelView: "search" }),
  setDownloadModalOpen: (open) => set({ downloadModalOpen: open }),

  openChat: (conversationId) => {
    const { activeChats, nextZIndex } = get();
    const existing = activeChats.find((c) => c.conversationId === conversationId);
    if (existing) {
      set({
        activeChats: activeChats.map((c) =>
          c.conversationId === conversationId
            ? { ...c, isMinimized: false, zIndex: nextZIndex }
            : c,
        ),
        nextZIndex: nextZIndex + 1,
        focusedConversationId: conversationId,
        panelOpen: false,
      });
      return;
    }
    set({
      activeChats: [
        ...activeChats,
        {
          conversationId,
          isMinimized: false,
          position: initialPosition(activeChats.length),
          zIndex: nextZIndex,
        },
      ],
      nextZIndex: nextZIndex + 1,
      focusedConversationId: conversationId,
      panelOpen: false,
    });
  },

  closeChat: (conversationId) =>
    set((s) => ({
      activeChats: s.activeChats.filter((c) => c.conversationId !== conversationId),
      focusedConversationId:
        s.focusedConversationId === conversationId ? null : s.focusedConversationId,
    })),

  minimizeChat: (conversationId) =>
    set((s) => ({
      activeChats: s.activeChats.map((c) =>
        c.conversationId === conversationId ? { ...c, isMinimized: true } : c,
      ),
      focusedConversationId:
        s.focusedConversationId === conversationId ? null : s.focusedConversationId,
    })),

  restoreChat: (conversationId) => {
    const { nextZIndex } = get();
    set((s) => ({
      activeChats: s.activeChats.map((c) =>
        c.conversationId === conversationId
          ? { ...c, isMinimized: false, zIndex: nextZIndex }
          : c,
      ),
      nextZIndex: nextZIndex + 1,
      focusedConversationId: conversationId,
    }));
  },

  bringToFront: (conversationId) => {
    const { nextZIndex } = get();
    set((s) => ({
      activeChats: s.activeChats.map((c) =>
        c.conversationId === conversationId ? { ...c, zIndex: nextZIndex } : c,
      ),
      nextZIndex: nextZIndex + 1,
      focusedConversationId: conversationId,
    }));
  },

  updateChatPosition: (conversationId, position) =>
    set((s) => ({
      activeChats: s.activeChats.map((c) =>
        c.conversationId === conversationId ? { ...c, position } : c,
      ),
    })),

  setTyping: (conversationId, isTyping) =>
    set((s) => ({
      typingByConversation: { ...s.typingByConversation, [conversationId]: isTyping },
    })),
  setOnline: (userId, isOnline) =>
    set((s) => ({
      onlineByUserId: { ...s.onlineByUserId, [userId]: isOnline },
    })),
}));
