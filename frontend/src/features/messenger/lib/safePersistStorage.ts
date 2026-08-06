import { createJSONStorage, type StateStorage } from "zustand/middleware";

/** Drops corrupted JSON blobs instead of crashing hydration with SyntaxError. */
export function createSafeLocalStorage(): StateStorage {
  const base = typeof window !== "undefined" ? window.localStorage : undefined;

  return {
    getItem: (name) => {
      if (!base) return null;
      try {
        const raw = base.getItem(name);
        if (raw == null || raw === "") return null;
        JSON.parse(raw);
        return raw;
      } catch {
        try {
          base.removeItem(name);
        } catch {
          /* private mode / quota */
        }
        return null;
      }
    },
    setItem: (name, value) => {
      if (!base) return;
      try {
        base.setItem(name, value);
      } catch {
        /* quota or private mode */
      }
    },
    removeItem: (name) => {
      if (!base) return;
      try {
        base.removeItem(name);
      } catch {
        /* ignore */
      }
    },
  };
}

export function createSafeJsonStorage() {
  return createJSONStorage(createSafeLocalStorage);
}
