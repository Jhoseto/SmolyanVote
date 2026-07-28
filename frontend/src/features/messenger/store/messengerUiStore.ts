import { create } from "zustand";
import type { ActiveChatWindow } from "../types";
import {
  clampPosition,
  tilePosition,
  windowSize,
  type WindowPoint,
} from "../lib/windowGeometry";

type PanelView = "list" | "calls" | "search";

const GEOMETRY_KEY = "svmessenger-window-geometry";
/** Keep floating windows below FAB/panel (z-1070) and dock (z-1069). */
const WINDOW_Z_FLOOR = 1000;
const WINDOW_Z_CEIL = 1059;

function allocateWindowZ(
  chats: ActiveChatWindow[],
  nextZIndex: number,
): { chats: ActiveChatWindow[]; z: number; nextZIndex: number } {
  if (nextZIndex < WINDOW_Z_CEIL) {
    return { chats, z: nextZIndex, nextZIndex: nextZIndex + 1 };
  }
  const sorted = [...chats].sort((a, b) => a.zIndex - b.zIndex);
  const remapped = chats.map((chat) => {
    const rank = sorted.findIndex((c) => c.conversationId === chat.conversationId);
    return { ...chat, zIndex: WINDOW_Z_FLOOR + Math.max(0, rank) };
  });
  const z = WINDOW_Z_FLOOR + remapped.length;
  return { chats: remapped, z, nextZIndex: z + 1 };
}

function readGeometry(): Record<string, WindowPoint> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(GEOMETRY_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, Partial<WindowPoint>>) : {};
    const result: Record<string, WindowPoint> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value?.x === "number" && typeof value?.y === "number") {
        result[key] = { x: value.x, y: value.y };
      }
    }
    return result;
  } catch {
    return {};
  }
}

function writeGeometry(conversationId: number, point: WindowPoint): void {
  if (typeof window === "undefined") return;
  try {
    const all = readGeometry();
    all[String(conversationId)] = point;
    window.localStorage.setItem(GEOMETRY_KEY, JSON.stringify(all));
  } catch {
    /* quota or private mode — geometry is a nicety, never a blocker */
  }
}

function createWindow(conversationId: number, openCount: number, zIndex: number): ActiveChatWindow {
  const saved = readGeometry()[String(conversationId)];
  const position = saved ? clampPosition(saved, windowSize(false)) : tilePosition(openCount);
  return { conversationId, isMinimized: false, position, maximized: false, zIndex };
}

export interface QuickReplyPrompt {
  conversationId: number;
  senderName: string;
  senderAvatar: string | null;
  text: string;
  receivedAt: number;
}

interface MessengerUiState {
  panelOpen: boolean;
  panelView: PanelView;
  downloadModalOpen: boolean;
  commandPaletteOpen: boolean;
  /** Incoming message from a conversation that isn't in focus. */
  quickReply: QuickReplyPrompt | null;
  activeChats: ActiveChatWindow[];
  nextZIndex: number;
  /** Display order of the minimized bubbles in the right rail, bottom-up. */
  dockOrder: number[];
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
  showCalls: () => void;
  showSearch: () => void;
  setDownloadModalOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setQuickReply: (prompt: QuickReplyPrompt | null) => void;

  openChat: (conversationId: number) => void;
  closeChat: (conversationId: number) => void;
  minimizeChat: (conversationId: number) => void;
  restoreChat: (conversationId: number) => void;
  bringToFront: (conversationId: number) => void;
  updateChatPosition: (conversationId: number, position: WindowPoint) => void;
  toggleMaximize: (conversationId: number) => void;
  reflowWindows: () => void;
  reorderDock: (order: number[]) => void;
  focusNextWindow: (backwards?: boolean) => void;

  setTyping: (conversationId: number, isTyping: boolean) => void;
  setOnline: (userId: number, isOnline: boolean) => void;
}

/**
 * Floating messenger shell state — multi-chat windows, per-window geometry and
 * the minimized-bubble rail. Message data itself stays in TanStack Query.
 */
export const useMessengerUiStore = create<MessengerUiState>((set, get) => ({
  panelOpen: false,
  panelView: "list",
  downloadModalOpen: false,
  commandPaletteOpen: false,
  quickReply: null,
  activeChats: [],
  nextZIndex: 1000,
  dockOrder: [],
  typingByConversation: {},
  onlineByUserId: {},
  focusedConversationId: null,

  openPanel: () => set({ panelOpen: true, panelView: "list" }),
  closePanel: () => set({ panelOpen: false, panelView: "list" }),
  togglePanel: () =>
    set((s) =>
      s.panelOpen
        ? { panelOpen: false, panelView: "list" as const }
        : { panelOpen: true, panelView: "list" as const },
    ),
  showList: () => set({ panelOpen: true, panelView: "list" }),
  showCalls: () => set({ panelOpen: true, panelView: "calls" }),
  showSearch: () => set({ panelOpen: true, panelView: "search" }),
  setDownloadModalOpen: (open) => set({ downloadModalOpen: open }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setQuickReply: (prompt) => set({ quickReply: prompt }),

  openChat: (conversationId) => {
    const { activeChats, nextZIndex, dockOrder } = get();
    const existing = activeChats.find((c) => c.conversationId === conversationId);
    if (existing) {
      const allocated = allocateWindowZ(activeChats, nextZIndex);
      set({
        activeChats: allocated.chats.map((c) =>
          c.conversationId === conversationId
            ? { ...c, isMinimized: false, zIndex: allocated.z }
            : c,
        ),
        dockOrder: dockOrder.filter((id) => id !== conversationId),
        nextZIndex: allocated.nextZIndex,
        focusedConversationId: conversationId,
        panelOpen: false,
      });
      return;
    }
    const allocated = allocateWindowZ(activeChats, nextZIndex);
    set({
      activeChats: [
        ...allocated.chats,
        createWindow(conversationId, allocated.chats.length, allocated.z),
      ],
      nextZIndex: allocated.nextZIndex,
      focusedConversationId: conversationId,
      panelOpen: false,
    });
  },

  closeChat: (conversationId) =>
    set((s) => ({
      activeChats: s.activeChats.filter((c) => c.conversationId !== conversationId),
      dockOrder: s.dockOrder.filter((id) => id !== conversationId),
      focusedConversationId:
        s.focusedConversationId === conversationId ? null : s.focusedConversationId,
    })),

  minimizeChat: (conversationId) =>
    set((s) => ({
      activeChats: s.activeChats.map((c) =>
        c.conversationId === conversationId ? { ...c, isMinimized: true } : c,
      ),
      dockOrder: s.dockOrder.includes(conversationId)
        ? s.dockOrder
        : [...s.dockOrder, conversationId],
      focusedConversationId:
        s.focusedConversationId === conversationId ? null : s.focusedConversationId,
    })),

  restoreChat: (conversationId) => {
    const { activeChats, nextZIndex } = get();
    const allocated = allocateWindowZ(activeChats, nextZIndex);
    set((s) => ({
      activeChats: allocated.chats.map((c) =>
        c.conversationId === conversationId ? { ...c, isMinimized: false, zIndex: allocated.z } : c,
      ),
      dockOrder: s.dockOrder.filter((id) => id !== conversationId),
      nextZIndex: allocated.nextZIndex,
      focusedConversationId: conversationId,
    }));
  },

  bringToFront: (conversationId) => {
    const { activeChats, nextZIndex, focusedConversationId } = get();
    if (focusedConversationId === conversationId) return;
    const allocated = allocateWindowZ(activeChats, nextZIndex);
    set({
      activeChats: allocated.chats.map((c) =>
        c.conversationId === conversationId ? { ...c, zIndex: allocated.z } : c,
      ),
      nextZIndex: allocated.nextZIndex,
      focusedConversationId: conversationId,
    });
  },

  updateChatPosition: (conversationId, position) => {
    const next = clampPosition(position, windowSize(false));
    set((s) => ({
      activeChats: s.activeChats.map((c) =>
        c.conversationId === conversationId ? { ...c, position: next, maximized: false } : c,
      ),
    }));
    writeGeometry(conversationId, next);
  },

  toggleMaximize: (conversationId) =>
    set((s) => ({
      activeChats: s.activeChats.map((c) =>
        c.conversationId === conversationId ? { ...c, maximized: !c.maximized } : c,
      ),
    })),

  /** Re-clamps every window after a viewport resize so none drift off-screen. */
  reflowWindows: () =>
    set((s) => ({
      activeChats: s.activeChats.map((c) => ({
        ...c,
        position: clampPosition(c.position, windowSize(false)),
      })),
    })),

  reorderDock: (order) => set({ dockOrder: order }),

  focusNextWindow: (backwards = false) => {
    const { activeChats, focusedConversationId } = get();
    const open = activeChats.filter((c) => !c.isMinimized);
    if (open.length < 2) return;
    const current = open.findIndex((c) => c.conversationId === focusedConversationId);
    const step = backwards ? -1 : 1;
    const next = open[(current + step + open.length) % open.length];
    get().bringToFront(next.conversationId);
  },

  setTyping: (conversationId, isTyping) =>
    set((s) => ({
      typingByConversation: { ...s.typingByConversation, [conversationId]: isTyping },
    })),
  setOnline: (userId, isOnline) =>
    set((s) => ({
      onlineByUserId: { ...s.onlineByUserId, [userId]: isOnline },
    })),
}));
