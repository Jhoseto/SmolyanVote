import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type MessengerDensity = "compact" | "comfortable" | "spacious";
export type MessengerSoundTheme = "subtle" | "classic" | "off";

interface MessengerPrefsState {
  density: MessengerDensity;
  soundTheme: MessengerSoundTheme;
  enterToSend: boolean;
  showReadReceipts: boolean;

  setDensity: (density: MessengerDensity) => void;
  setSoundTheme: (theme: MessengerSoundTheme) => void;
  setEnterToSend: (value: boolean) => void;
  setShowReadReceipts: (value: boolean) => void;
}

/** Desktop-only personalisation. Mobile ships its own settings screen. */
export const useMessengerPrefsStore = create<MessengerPrefsState>()(
  persist(
    (set) => ({
      density: "compact",
      soundTheme: "subtle",
      enterToSend: true,
      showReadReceipts: true,

      setDensity: (density) => set({ density }),
      setSoundTheme: (soundTheme) => set({ soundTheme }),
      setEnterToSend: (enterToSend) => set({ enterToSend }),
      setShowReadReceipts: (showReadReceipts) => set({ showReadReceipts }),
    }),
    {
      name: "svmessenger-prefs",
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Record<string, unknown>;
        // v1 → v2: wallpapers removed; keep the rest of the prefs.
        if (version < 2) {
          delete state.wallpaperByConversation;
        }
        return {
          density:
            state.density === "comfortable" || state.density === "spacious"
              ? state.density
              : "compact",
          soundTheme:
            state.soundTheme === "classic" || state.soundTheme === "off"
              ? state.soundTheme
              : "subtle",
          enterToSend: state.enterToSend !== false,
          showReadReceipts: state.showReadReceipts !== false,
        } as MessengerPrefsState;
      },
    },
  ),
);
