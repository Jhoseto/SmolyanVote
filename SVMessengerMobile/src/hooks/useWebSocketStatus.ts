/**
 * useWebSocketStatus Hook
 * Обработка на online status updates
 */

import { useCallback } from 'react';
import { svMobileWebSocketService } from '../services/websocket/stompClient';
import { useConversationsStore } from '../store/conversationsStore';

export const useWebSocketStatus = () => {
  const { conversations, updateConversation } = useConversationsStore();

  // Handle online status updates
  const handleOnlineStatus = useCallback((data: any) => {
    console.log('🌐 WebSocket: Online status update:', data);

    if (data.userId && data.status) {
      // Update conversation participant online status
      let updated = false;
      conversations.forEach((conv) => {
        if (conv.participant?.id === data.userId) {
          updateConversation(conv.id, {
            participant: {
              ...conv.participant,
              isOnline: data.status === 'ONLINE',
              lastSeen: data.lastSeen,
            },
          });
          updated = true;
        }
      });

      if (updated) {
        console.log('✅ Updated online status for user:', data.userId, 'status:', data.status);
      }
    }
  }, [conversations, updateConversation]);

  // The new WebSocket service handles subscriptions automatically when connecting
  // The handleOnlineStatus callback is passed during connection

  return {
    handleOnlineStatus,
  };
};
