import { create } from "zustand";
import type { CallSignal, CallUiState, Conversation } from "../types";

export interface CurrentCall {
  conversationId: number;
  otherUserId: number;
  roomName: string;
  conversation: Conversation | null;
  startTime: string;
  isIncoming: boolean;
  isVideoCall: boolean;
  token: string | null;
  serverUrl: string | null;
  callerName: string | null;
  callerAvatar: string | null;
}

interface CallStoreState {
  callState: CallUiState;
  currentCall: CurrentCall | null;
  showDeviceSelector: boolean;
  deviceSelectorMode: "call" | "settings";
  pendingAction: (() => void) | null;
  hasEverConnected: boolean;
  endSignalSent: boolean;

  setCallState: (state: CallUiState) => void;
  setCurrentCall: (call: CurrentCall | null) => void;
  patchCurrentCall: (patch: Partial<CurrentCall>) => void;
  setShowDeviceSelector: (show: boolean, mode?: "call" | "settings") => void;
  setPendingAction: (action: (() => void) | null) => void;
  setHasEverConnected: (v: boolean) => void;
  setEndSignalSent: (v: boolean) => void;
  reset: () => void;
}

const initial = {
  callState: "idle" as CallUiState,
  currentCall: null as CurrentCall | null,
  showDeviceSelector: false,
  deviceSelectorMode: "call" as const,
  pendingAction: null as (() => void) | null,
  hasEverConnected: false,
  endSignalSent: false,
};

export const useCallStore = create<CallStoreState>((set) => ({
  ...initial,
  setCallState: (callState) => set({ callState }),
  setCurrentCall: (currentCall) => set({ currentCall }),
  patchCurrentCall: (patch) =>
    set((s) => (s.currentCall ? { currentCall: { ...s.currentCall, ...patch } } : s)),
  setShowDeviceSelector: (showDeviceSelector, mode) =>
    set((s) => ({
      showDeviceSelector,
      deviceSelectorMode: mode ?? s.deviceSelectorMode,
    })),
  setPendingAction: (pendingAction) => set({ pendingAction }),
  setHasEverConnected: (hasEverConnected) => set({ hasEverConnected }),
  setEndSignalSent: (endSignalSent) => set({ endSignalSent }),
  reset: () => set({ ...initial }),
}));

/** Incoming signal stash while ringing (avoids losing roomName before accept). */
export type IncomingSignal = CallSignal;
