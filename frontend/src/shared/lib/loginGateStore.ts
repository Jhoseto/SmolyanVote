import { create } from "zustand";

export type AuthModalView = "login" | "register" | "forgot";

interface LoginGateState {
  isOpen: boolean;
  view: AuthModalView;
  reason: string | null;
  resolve: ((value: boolean) => void) | null;
  /** Gated action — opens login view; resolves true after successful login. */
  request: (reason?: string) => Promise<boolean>;
  /** Open auth modal on a specific view (navbar/footer CTAs). */
  open: (view?: AuthModalView) => void;
  setView: (view: AuthModalView) => void;
  respond: (value: boolean) => void;
}

/**
 * Imperative auth-modal store. `useRequireAuth()` calls `request()` for
 * anonymous gated actions; navbar/footer call `open("login"|"register")`.
 */
export const useLoginGateStore = create<LoginGateState>((set, get) => ({
  isOpen: false,
  view: "login",
  reason: null,
  resolve: null,
  request: (reason) =>
    new Promise<boolean>((resolve) => {
      get().resolve?.(false);
      set({ isOpen: true, view: "login", reason: reason ?? null, resolve });
    }),
  open: (view = "login") => {
    get().resolve?.(false);
    set({ isOpen: true, view, reason: null, resolve: null });
  },
  setView: (view) => set({ view }),
  respond: (value) => {
    get().resolve?.(value);
    set({ isOpen: false, reason: null, resolve: null, view: "login" });
  },
}));
