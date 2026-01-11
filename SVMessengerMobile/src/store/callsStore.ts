/**
 * Calls Store (Zustand)
 * Управление на call state
 */

import { create } from 'zustand';
import { Call, CallState } from '../types/call';

interface CallsState {
  currentCall: Call | null;
  callState: CallState;
  isMuted: boolean;
  missedCallsCount: number;
  isVideoCall: boolean; // Flag за video call
}

interface CallsStore extends CallsState {
  // Actions
  startCall: (conversationId: number, participantId: number, participantName: string, participantImageUrl?: string, initialState?: CallState, isVideo?: boolean) => void;
  answerCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  setCallState: (state: CallState) => void;
  toggleMute: () => void;
  clearCall: () => void;
  incrementMissedCalls: () => void;
  resetMissedCalls: () => void;
}

export const useCallsStore = create<CallsStore>((set, get) => ({
  // Initial state
  currentCall: null,
  callState: CallState.IDLE,
  isMuted: false,
  missedCallsCount: 0,
  isVideoCall: false,

  // Start call
  startCall: (conversationId: number, participantId: number, participantName: string, participantImageUrl?: string, initialState?: CallState, isVideo?: boolean) => {
    const callState = initialState || CallState.OUTGOING;
    const call: Call = {
      id: `call-${Date.now()}`,
      conversationId,
      participantId,
      participantName,
      participantImageUrl,
      state: callState,
      startTime: new Date(),
    };

    set({
      currentCall: call,
      callState: callState,
      isVideoCall: isVideo || false,
    });
  },

  // Answer call
  answerCall: () => {
    set((state) => ({
      callState: CallState.CONNECTING,
      currentCall: state.currentCall
        ? { ...state.currentCall, state: CallState.CONNECTING }
        : null,
    }));
  },

  // Reject call
  rejectCall: () => {
    set({
      currentCall: null,
      callState: CallState.IDLE,
    });
  },

  // End call
  endCall: () => {
    set((state) => ({
      callState: CallState.DISCONNECTED,
      currentCall: state.currentCall
        ? { ...state.currentCall, state: CallState.DISCONNECTED, endTime: new Date() }
        : null,
    }));

    // Clear call after a delay
    setTimeout(() => {
      get().clearCall();
    }, 1000);
  },

  // Set call state
  setCallState: (state: CallState) => {
    set((currentState) => ({
      callState: state,
      currentCall: currentState.currentCall
        ? { ...currentState.currentCall, state }
        : null,
    }));
  },

  // Toggle mute
  toggleMute: () => {
    set((state) => ({
      isMuted: !state.isMuted,
    }));
  },

  // Clear call
  clearCall: () => {
    set({
      currentCall: null,
      callState: CallState.IDLE,
      isMuted: false,
      isVideoCall: false,
    });
  },

  // Increment missed calls counter
  incrementMissedCalls: () => {
    set((state) => ({
      missedCallsCount: state.missedCallsCount + 1,
    }));
  },

  // Reset missed calls counter
  resetMissedCalls: () => {
    set({
      missedCallsCount: 0,
    });
  },
}));

