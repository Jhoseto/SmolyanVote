/**
 * Calls Store (Zustand)
 * Управление на call state
 */

import { create } from 'zustand';
import { Platform } from 'react-native';
import { NativeModules } from 'react-native';
import { Call, CallState } from '../types/call';
import { CallSignal } from '../types/websocket';
import { useAuthStore } from './authStore';

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
  setCallStartTime: () => void; // CRITICAL: Set startTime manually when participant connects
  toggleMute: () => void;
  clearCall: () => void;
  incrementMissedCalls: () => void;
  resetMissedCalls: () => void;
  clearCallState: () => void; // Add missing method
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
    // CRITICAL: Determine if this is an outgoing call (current user initiated it)
    const isOutgoing = callState === CallState.OUTGOING;
    const call: Call = {
      id: `call-${Date.now()}`,
      conversationId,
      participantId,
      participantName,
      participantImageUrl,
      state: callState,
      // CRITICAL FIX: Don't set startTime here - it should only be set when call becomes CONNECTED
      // This ensures timer starts counting only after the other party answers
      startTime: undefined,
      // CRITICAL: Track if this is an outgoing call to determine caller/receiver later
      isOutgoing: isOutgoing,
    };

    set({
      currentCall: call,
      callState: callState,
      isVideoCall: isVideo || false,
    });
  },

  // Answer call
  answerCall: () => {
    // CRITICAL: Do NOT set callState to CONNECTING here
    // For incoming calls, we should stay in INCOMING state until LiveKit participant connects
    // Then onParticipantConnected callback will set it to CONNECTED
    // Setting CONNECTING here causes OutgoingCallScreen to show incorrectly
    set((state) => ({
      currentCall: state.currentCall,
    }));
  },

  // Reject call
  rejectCall: () => {
    set({
      currentCall: null,
      callState: CallState.IDLE,
    });
    // CRITICAL: Send broadcast to close IncomingCallActivity
    if (Platform.OS === 'android') {
      try {
        const { NotificationModule } = NativeModules;
        if (NotificationModule?.sendCallStateBroadcast) {
          NotificationModule.sendCallStateBroadcast('IDLE').catch(() => { });
        }
      } catch (e) {
        // Ignore errors - broadcast is optional
      }
    }
  },

  // End call
  endCall: () => {
    const now = new Date();

    // We don't send WebSocket signal here anymore - it is handled in useCalls hook
    // This prevents duplicate CALL_END signals since the hook was also sending one

    set((state) => ({
      callState: CallState.DISCONNECTED,
      currentCall: state.currentCall
        ? {
          ...state.currentCall,
          state: CallState.DISCONNECTED,
          endTime: now,
          // CRITICAL: Ensure startTime is set if it wasn't set before (fallback)
          // This prevents duration calculation issues
          startTime: state.currentCall.startTime || now
        }
        : null,
    }));

    // CRITICAL: Send broadcast to close IncomingCallActivity
    if (Platform.OS === 'android') {
      try {
        const { NotificationModule } = NativeModules;
        if (NotificationModule?.sendCallStateBroadcast) {
          NotificationModule.sendCallStateBroadcast('DISCONNECTED').catch(() => { });
        }
      } catch (e) {
        // Ignore errors - broadcast is optional
      }
    }

    // Clear call after a delay (without triggering broadcast)
    setTimeout(() => {
      get().clearCallState();
    }, 1000);
  },

  // Set call state
  setCallState: (state: CallState) => {
    set((currentState) => {
      const currentCall = currentState.currentCall;

      // CRITICAL: DON'T automatically set startTime here
      // startTime should only be set by useCalls when liveKitService confirms participant connected
      // This prevents counting ringing time as call duration

      return {
        callState: state,
        currentCall: currentCall
          ? {
            ...currentCall,
            state,
          }
          : null,
      };
    });
  },

  // CRITICAL: Manually set startTime when participant connects
  setCallStartTime: () => {
    set((currentState) => {
      const currentCall = currentState.currentCall;

      // Only set if call exists and startTime not already set
      if (!currentCall || currentCall.startTime) {
        return currentState;
      }

      return {
        currentCall: {
          ...currentCall,
          startTime: new Date(),
        },
      };
    });
  },

  // Toggle mute
  toggleMute: () => {
    set((state) => ({
      isMuted: !state.isMuted,
    }));
  },

  // Clear call
  // CRITICAL: Separate method for clearing call state without triggering broadcast
  clearCallState: () => {
    set({
      currentCall: null,
      callState: CallState.IDLE,
      isMuted: false,
      isVideoCall: false,
    });
  },

  clearCall: () => {
    set({
      currentCall: null,
      callState: CallState.IDLE,
      isMuted: false,
      isVideoCall: false,
    });
    // CRITICAL: Send broadcast to close IncomingCallActivity
    if (Platform.OS === 'android') {
      try {
        const { NotificationModule } = NativeModules;
        if (NotificationModule?.sendCallStateBroadcast) {
          NotificationModule.sendCallStateBroadcast('IDLE').catch(() => { });
        }
      } catch (e) {
        // Ignore errors - broadcast is optional
      }
    }
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

