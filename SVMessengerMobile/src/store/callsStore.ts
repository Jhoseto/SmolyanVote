/**
 * Calls Store - Mobile Call State Management
 * REFACTORED: Single source of truth with explicit boolean flags
 * Senior-level architecture: Clear, maintainable, race-condition free
 */

import { create } from 'zustand';
import { Platform, NativeModules } from 'react-native';

/**
 * Call participant information
 */
export interface CallParticipant {
  id: number;
  name: string;
  imageUrl?: string;
}

/**
 * Core call data structure
 */
export interface CallData {
  conversationId: number;
  participant: CallParticipant;
  roomName?: string;
  token?: string;
  serverUrl?: string;
  isVideoCall: boolean;
  isOutgoing: boolean;
  startTime?: Date;
  endTime?: Date;
}

/**
 * Call state using explicit boolean flags
 * ARCHITECTURE: Single responsibility - each flag represents ONE thing
 */
export interface CallsState {
  // Core call data
  currentCall: CallData | null;

  // Explicit state flags - NO AMBIGUITY
  isRinging: boolean;      // Incoming call, not yet answered
  isDialing: boolean;      // Outgoing call, not yet connected
  isAccepting: boolean;    // Answered, waiting for connection (Hybrid Flow)
  isConnected: boolean;    // Active conversation
  isEnding: boolean;       // Call cleanup in progress

  // UI state
  isMuted: boolean;
  isSpeakerOn: boolean;
  isVideoEnabled: boolean;

  // Actions
  setIncomingCall: (data: CallData) => void;
  setOutgoingCall: (data: CallData) => void;
  setAccepting: () => void;
  setConnected: () => void;
  setEnding: () => void;
  clearCall: () => void;

  setCallStartTime: () => void;
  setCallEndTime: () => void;

  toggleMute: () => void;
  toggleSpeaker: () => void;
  toggleVideo: () => void;
  setVideoEnabled: (enabled: boolean) => void;
}

/**
 * Zustand store with clean state management
 */
export const useCallsStore = create<CallsState>((set, get) => ({
  // Initial state
  currentCall: null,
  isRinging: false,
  isDialing: false,
  isAccepting: false,
  isConnected: false,
  isEnding: false,
  isMuted: false,
  isSpeakerOn: false,
  isVideoEnabled: false,

  /**
   * Set incoming call - user is being called
   */
  setIncomingCall: (data: CallData) => {
    set({
      currentCall: { ...data, isOutgoing: false },
      isRinging: true,
      isDialing: false,
      isAccepting: false,
      isConnected: false,
      isEnding: false,
    });
  },

  /**
   * Set outgoing call - user is calling someone
   */
  setOutgoingCall: (data: CallData) => {
    set({
      currentCall: { ...data, isOutgoing: true },
      isRinging: false,
      isDialing: true,
      isAccepting: false,
      isConnected: false,
      isEnding: false,
    });
  },

  /**
   * Set accepting - used for immediate UI feedback (Hybrid Flow)
   */
  setAccepting: () => {
    set({
      isAccepting: true,
      // Keep isRinging true until connected to prevent premature unmount if needed,
      // BUT for Hybrid Flow we might want isRinging to remain true so IncomingCallScreen stays mounted
      // to show the "Connecting..." state.
      // So we just set isAccepting=true.
    });
  },

  /**
   * Mark call as connected - conversation started
   */
  setConnected: () => {
    set({
      isRinging: false,
      isDialing: false,
      isAccepting: false,
      isConnected: true,
      isEnding: false,
    });
  },

  /**
   * Mark call as ending - cleanup in progress
   */
  setEnding: () => {
    const { currentCall } = get();
    if (!currentCall) return;

    set({
      isRinging: false,
      isDialing: false,
      isAccepting: false,
      isConnected: false,
      isEnding: true,
      currentCall: {
        ...currentCall,
        endTime: currentCall.endTime || new Date(),
      },
    });
  },

  /**
   * Clear call completely - back to idle
   */
  clearCall: () => {
    set({
      currentCall: null,
      isRinging: false,
      isDialing: false,
      isAccepting: false,
      isConnected: false,
      isEnding: false,
      isMuted: false,
      isSpeakerOn: false,
      isVideoEnabled: false,
    });

    // CRITICAL: Send broadcast to close any Android notification activity
    if (Platform.OS === 'android') {
      try {
        const { NotificationModule } = NativeModules;
        if (NotificationModule?.sendCallStateBroadcast) {
          NotificationModule.sendCallStateBroadcast('IDLE').catch(() => { });
        }
      } catch (e) {
        // Ignore - broadcast is optional
      }
    }
  },

  /**
   * Set call start time - when conversation begins
   */
  setCallStartTime: () => {
    set((state) => {
      if (!state.currentCall || state.currentCall.startTime) {
        return state;
      }
      return {
        currentCall: {
          ...state.currentCall,
          startTime: new Date(),
        },
      };
    });
  },

  /**
   * Set call end time - when call ends
   */
  setCallEndTime: () => {
    set((state) => {
      if (!state.currentCall) {
        return state;
      }
      return {
        currentCall: {
          ...state.currentCall,
          endTime: new Date(),
        },
      };
    });
  },

  /**
   * Toggle mute state
   */
  toggleMute: () => {
    set((state) => ({ isMuted: !state.isMuted }));
  },

  /**
   * Toggle speaker state
   */
  toggleSpeaker: () => {
    set((state) => ({ isSpeakerOn: !state.isSpeakerOn }));
  },

  /**
   * Toggle video state
   */
  toggleVideo: () => {
    set((state) => ({ isVideoEnabled: !state.isVideoEnabled }));
  },

  /**
   * Set video enabled state directly
   */
  setVideoEnabled: (enabled: boolean) => {
    set({ isVideoEnabled: enabled });
  },
}));
