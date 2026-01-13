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
import { logger } from '../utils/logger';

export const useWebSocketCalls = () => {
  const { setCallState, startCall, incrementMissedCalls } = useCallsStore();
  const { incrementUnreadCount } = useConversationsStore();

  // Handle call signals
  const handleCallSignal = useCallback(async (data: any) => {
    try {
      const signal = data;
      // Backend използва 'eventType', не 'type'
      const eventType = signal.eventType || signal.type;

      switch (eventType) {
        case 'CALL_REQUEST':
          try {
            // Уверете се че данните са правилни типове
            const conversationId = Number(signal.conversationId);
            const callerId = Number(signal.callerId);
            
            if (!conversationId || !callerId) {
              logger.error('❌ [useWebSocketCalls] Invalid conversationId or callerId:', {
                conversationId: signal.conversationId,
                callerId: signal.callerId,
              });
              return;
            }
            
            // Опитай да намериш информация за участника от store/API
            const { getConversation, conversations } = useConversationsStore.getState();
            let participant = conversations.find((c) => c.id === conversationId)?.participant;
            if (!participant) {
              const conv = await getConversation(conversationId).catch(() => null);
              participant = conv?.participant;
            }

            const participantName = signal.callerName || participant?.fullName || participant?.username || 'Потребител';
            const participantImageUrl = participant?.imageUrl;

            // Създай currentCall обект директно с INCOMING state
            startCall(
              conversationId,
              callerId,
              participantName,
              participantImageUrl || signal.callerAvatar,
              CallState.INCOMING // Задай state директно при създаване
            );
            
            // Play ringtone - fire and forget
            soundService.playIncomingCallSound();
          } catch (error) {
            logger.error('❌ [useWebSocketCalls] Error handling CALL_REQUEST:', error);
          }
          break;

        case 'CALL_ACCEPT':
        case 'CALL_ACCEPTED':
          setCallState(CallState.CONNECTED);
          soundService.stopIncomingCallSound();
          break;

        case 'CALL_REJECT':
        case 'CALL_REJECTED':
          setCallState(CallState.IDLE);
          soundService.stopIncomingCallSound();
          break;

        case 'CALL_END':
        case 'CALL_ENDED':
          // CRITICAL: Only set call state to IDLE, DO NOT send CALL_END signal back
          // The call history should only be saved by the user who pressed "end call" in UI
          setCallState(CallState.IDLE);
          soundService.stopIncomingCallSound();
          break;

        case 'CALL_MISSED':
          setCallState(CallState.IDLE);
          incrementMissedCalls();
          soundService.stopIncomingCallSound();
          break;

        default:
          logger.error('Unknown call signal eventType:', eventType, 'Full signal:', signal);
      }
    } catch (error) {
      logger.error('Error handling call signal:', error);
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
