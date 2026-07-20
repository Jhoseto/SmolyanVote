import { create } from "zustand";

export interface VoteConfirmDetails {
  /** Labels the user is about to vote for (shown as badges). */
  selectedLabels: string[];
  /** Multi-select wording (“гласовете” vs “гласа”). */
  plural?: boolean;
}

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  /** Renders the confirm action in the destructive (red) style. */
  destructive?: boolean;
  /**
   * Rich vote confirmation (v1 `voteConfirmModal`): selected badges,
   * irreversible warning, and a required acknowledgment checkbox.
   */
  voteConfirm?: VoteConfirmDetails;
}

interface ConfirmState {
  options: ConfirmOptions | null;
  resolve: ((value: boolean) => void) | null;
  request: (options: ConfirmOptions) => Promise<boolean>;
  respond: (value: boolean) => void;
}

/**
 * Imperative confirm-dialog store — `request()` can be called from anywhere
 * (event handlers, mutation callbacks) and returns a Promise<boolean>,
 * resolved once the single `<ConfirmDialogHost/>` (mounted in AppProviders)
 * renders the answer. Avoids `window.confirm()` (blocking, unstyled).
 */
export const useConfirmStore = create<ConfirmState>((set, get) => ({
  options: null,
  resolve: null,
  request: (options) =>
    new Promise<boolean>((resolve) => {
      // Only one confirm dialog can be open at a time — resolve any
      // pending previous request as cancelled before opening a new one.
      get().resolve?.(false);
      set({ options, resolve });
    }),
  respond: (value) => {
    get().resolve?.(value);
    set({ options: null, resolve: null });
  },
}));
