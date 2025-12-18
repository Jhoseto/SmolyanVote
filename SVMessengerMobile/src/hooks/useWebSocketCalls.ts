/**
 * useWebSocketCalls Hook
 * Обработка на WebSocket calls и signals
 */

import { useCallback } from 'react';
import { svMobileWebSocketService } from '../services/websocket/stompClient';
import { useCallsStore } from '../store/callsStore';
import { useConversationsStore } from '../store/conversationsStore';
import { soundService } from '../services/sounds/soundService';
import { CallState } from '../types/call';

export const useWebSocketCalls = () => {
  const { setCallState, startCall, incrementMissedCalls } = useCallsStore();
  const { incrementUnreadCount } = useConversationsStore();

  // Handle call signals
  const handleCallSignal = useCallback((data: any) => {
    console.log('📞 WebSocket: Call signal received:', data);

    try {
      const signal = data;

      switch (signal.type) {
        case 'CALL_INITIATED':
          console.log('📞 Incoming call initiated:', signal.callId);
          setCallState(CallState.INCOMING, {
            id: signal.callId,
            callerId: signal.callerId,
            callerName: signal.callerName,
            conversationId: signal.conversationId,
          });

          // Play ringtone
          soundService.playSound('ringtone');
          break;

        case 'CALL_ACCEPTED':
          console.log('📞 Call accepted:', signal.callId);
          setCallState(CallState.CONNECTED);
          soundService.stopSound('ringtone');
          break;

        case 'CALL_REJECTED':
          console.log('📞 Call rejected:', signal.callId);
          setCallState(CallState.IDLE);
          soundService.stopSound('ringtone');
          break;

        case 'CALL_ENDED':
          console.log('📞 Call ended:', signal.callId);
          setCallState(CallState.IDLE);
          soundService.stopSound('ringtone');
          break;

        case 'CALL_MISSED':
          console.log('📞 Call missed:', signal.callId);
          setCallState(CallState.IDLE);
          incrementMissedCalls();
          soundService.stopSound('ringtone');
          break;

        default:
          console.warn('Unknown call signal type:', signal.type);
      }
    } catch (error) {
      console.error('Error handling call signal:', error);
    }
  }, [setCallState, startCall, incrementMissedCalls]);

  // Send call signal
  const sendCallSignal = useCallback((signal: any) => {
    return svMobileWebSocketService.sendCallSignal(signal);
  }, []);

  // The new WebSocket service handles subscriptions automatically when connecting
  // The handleCallSignal callback is passed during connection

  return {
    sendCallSignal,
    handleCallSignal,
  };
};
