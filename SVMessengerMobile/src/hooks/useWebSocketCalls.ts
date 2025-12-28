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
  const handleCallSignal = useCallback(async (data: any) => {
    console.log('📞 [useWebSocketCalls] handleCallSignal called with:', data);
    console.log('📞 [useWebSocketCalls] Data type:', typeof data, 'Keys:', data ? Object.keys(data) : 'null');

    try {
      const signal = data;
      // Backend използва 'eventType', не 'type'
      const eventType = signal.eventType || signal.type;

      switch (eventType) {
        case 'CALL_REQUEST':
          console.log('📞 [useWebSocketCalls] Incoming call request received:', {
            conversationId: signal.conversationId,
            callerId: signal.callerId,
            callerName: signal.callerName,
            callerAvatar: signal.callerAvatar,
            fullSignal: signal,
          });
          
          try {
            // Уверете се че данните са правилни типове
            const conversationId = Number(signal.conversationId);
            const callerId = Number(signal.callerId);
            
            if (!conversationId || !callerId) {
              console.error('❌ [useWebSocketCalls] Invalid conversationId or callerId:', {
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
            
            console.log('✅ [useWebSocketCalls] startCall executed successfully:', {
              conversationId,
              callerId,
              callerName: participantName,
            });
            
            // Play ringtone
            soundService.playIncomingCallSound().catch(err => console.error('Error playing incoming call sound:', err));
          } catch (error) {
            console.error('❌ [useWebSocketCalls] Error handling CALL_REQUEST:', error);
          }
          break;

        case 'CALL_ACCEPT':
        case 'CALL_ACCEPTED':
          console.log('📞 Call accepted');
          setCallState(CallState.CONNECTED);
          soundService.stopIncomingCallSound().catch(err => console.error('Error stopping incoming call sound:', err));
          break;

        case 'CALL_REJECT':
        case 'CALL_REJECTED':
          console.log('📞 Call rejected');
          setCallState(CallState.IDLE);
          soundService.stopIncomingCallSound().catch(err => console.error('Error stopping incoming call sound:', err));
          break;

        case 'CALL_END':
        case 'CALL_ENDED':
          console.log('📞 Call ended');
          setCallState(CallState.IDLE);
          soundService.stopIncomingCallSound().catch(err => console.error('Error stopping incoming call sound:', err));
          break;

        case 'CALL_MISSED':
          console.log('📞 Call missed');
          setCallState(CallState.IDLE);
          incrementMissedCalls();
          soundService.stopIncomingCallSound().catch(err => console.error('Error stopping incoming call sound:', err));
          break;

        default:
          console.warn('Unknown call signal eventType:', eventType, 'Full signal:', signal);
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
