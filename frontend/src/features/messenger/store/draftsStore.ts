import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createSafeJsonStorage } from "../lib/safePersistStorage";

interface DraftsState {
  /** conversationId → unsent text */
  drafts: Record<number, string>;
  setDraft: (conversationId: number, text: string) => void;
  clearDraft: (conversationId: number) => void;
}

/** Unsent message text survives window close, reload and tab switches. */
export const useDraftsStore = create<DraftsState>()(
  persist(
    (set) => ({
      drafts: {},
      setDraft: (conversationId, text) =>
        set((s) => {
          if (!text.trim()) {
            if (s.drafts[conversationId] === undefined) return s;
            const next = { ...s.drafts };
            delete next[conversationId];
            return { drafts: next };
          }
          return { drafts: { ...s.drafts, [conversationId]: text } };
        }),
      clearDraft: (conversationId) =>
        set((s) => {
          if (s.drafts[conversationId] === undefined) return s;
          const next = { ...s.drafts };
          delete next[conversationId];
          return { drafts: next };
        }),
    }),
    {
      name: "svmessenger-drafts",
      storage: createSafeJsonStorage(),
      version: 1,
    },
  ),
);
