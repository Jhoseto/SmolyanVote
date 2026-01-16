/**
 * WebSocket Call Signal Handler
 * REFACTORED: Pure signal routing - NO state management here
 * Responsibility: Route incoming WebSocket signals to appropriate store actions
 */

import { useCallback } from 'react';
import { svMobileWebSocketService } from '../services/websocket/stompClient';
import { useCallsStore } from '../store/callsStore';
import { soundService } from '../services/sounds/soundService';
import { logger } from '../utils/logger';
import type { CallSignal } from '../types/websocket';

/**
 * WebSocket call signal handler hook
 * Clean architecture: Listen → Route → Done
 */
export const useWebSocketCalls = () => {
  const {
    setIncomingCall,
    setConnected,
    setEnding,
    clearCall,
    currentCall,
    isRinging,
    isDialing,
  } = useCallsStore();

  /**
   * Helper: Handle incoming call request
   */
  const handleIncomingCall = useCallback((signal: CallSignal) => {
    // Defensive: Ignore if already in a call
    if (currentCall || isRinging || isDialing) {
      logger.warn('📞 [WebSocket] Ignoring CALL_REQUEST - already in call');
      return;
    }

    // Start ringing sound
    soundService.playIncomingCallSound();

    // Update store
    setIncomingCall({
      conversationId: signal.conversationId,
      participant: {
        id: signal.callerId!,
        name: signal.callerName || 'Unknown',
        imageUrl: signal.callerAvatar,
      },
      roomName: signal.roomName,
      isVideoCall: signal.isVideoCall || false,
      isOutgoing: false,
    });

    logger.debug('📞 [WebSocket] Incoming call set, ringing...');
  }, [currentCall, isRinging, isDialing, setIncomingCall]);

  /**
   * Helper: Handle call accepted
   */
  const handleCallAccepted = useCallback((signal: CallSignal) => {
    // Only relevant if we're the caller (isDialing)
    if (!isDialing) {
      logger.debug('📞 [WebSocket] Ignoring CALL_ACCEPTED - not dialing');
      return;
    }

    logger.debug('📞 [WebSocket] Call accepted by remote party');
    // Note: setConnected() will be called by LiveKit onParticipantConnected
    // This signal just confirms acceptance, LiveKit handles connection
  }, [isDialing]);

  /**
   * Helper: Handle call rejected
   */
  const handleCallRejected = useCallback((signal: CallSignal) => {
    logger.debug('📞 [WebSocket] Call rejected by remote party');

    // Stop sounds
    soundService.stopOutgoingCallSound();
    soundService.stopIncomingCallSound();

    // Clear call immediately
    clearCall();
  }, [clearCall]);

  /**
   * Helper: Handle call cancelled
   */
  const handleCallCancelled = useCallback((signal: CallSignal) => {
    logger.debug('📞 [WebSocket] Call cancelled by remote party');

    // Only relevant if we're ringing
    // CRITICAL FIX: Don't check !isRinging - always stop sound just in case
    // if (!isRinging) {
    //   logger.debug('📞 [WebSocket] Ignoring CALL_CANCEL - not ringing');
    //   return;
    // }

    // Stop ringing sound
    soundService.stopIncomingCallSound();

    // Clear call
    clearCall();
  }, [isRinging, clearCall]);

  /**
   * Helper: Handle call ended
   */
  const handleCallEnded = useCallback((signal: CallSignal) => {
    logger.debug('📞 [WebSocket] Call ended by remote party');

    // Stop all sounds
    soundService.stopOutgoingCallSound();
    soundService.stopIncomingCallSound();

    // Mark as ending (will trigger cleanup)
    setEnding();

    // Clear after brief delay to allow animations
    setTimeout(() => {
      clearCall();
    }, 500);
  }, [setEnding, clearCall]);

  /**
   * Central signal router
   * Maps each signal type to appropriate action
   */
  const handleCallSignal = useCallback((signal: CallSignal) => {
    logger.debug('📞 [WebSocket] Received signal:', signal.eventType, signal);

    switch (signal.eventType) {
      case 'CALL_REQUEST':
        handleIncomingCall(signal);
        break;

      case 'CALL_ACCEPT':
      case 'CALL_ACCEPTED':
        handleCallAccepted(signal);
        break;

      case 'CALL_REJECT':
      case 'CALL_REJECTED':
        handleCallRejected(signal);
        break;

      case 'CALL_CANCEL':
        handleCallCancelled(signal);
        break;

      case 'CALL_END':
      case 'CALL_ENDED':
        handleCallEnded(signal);
        break;

      default:
        logger.warn('📞 [WebSocket] Unknown signal type:', signal.eventType);
    }
  }, [
    handleIncomingCall,
    handleCallAccepted,
    handleCallRejected,
    handleCallCancelled,
    handleCallEnded
  ]);

  /**
   * Send call signal via WebSocket
   */
  const sendCallSignal = useCallback((signal: CallSignal) => {
    return svMobileWebSocketService.sendCallSignal(signal);
  }, []);

  return {
    handleCallSignal,
    sendCallSignal,
  };
};
