/**
 * useWebSocketTyping Hook
 * Обработка на typing status updates
 */

import { useCallback } from 'react';
import { svMobileWebSocketService } from '../services/websocket/stompClient';
import { useMessagesStore } from '../store/messagesStore';

export const useWebSocketTyping = () => {
  const { setTyping } = useMessagesStore();

  // Handle typing status updates
  const handleTypingStatus = useCallback((data: any) => {
    if (data.conversationId && typeof data.isTyping === 'boolean') {
      setTyping(data.conversationId, data.userId, data.isTyping);
    }
  }, [setTyping]);

  // Subscribe to typing status for specific conversation
  const subscribeToTypingStatus = useCallback((conversationId: number) => {
    return svMobileWebSocketService.subscribeToTyping(conversationId, handleTypingStatus);
  }, [handleTypingStatus]);

  // Unsubscribe from typing status
  const unsubscribeFromTypingStatus = useCallback((conversationId: number) => {
    svMobileWebSocketService.unsubscribeFromTyping(conversationId);
  }, []);

  return {
    subscribeToTypingStatus,
    unsubscribeFromTypingStatus,
    handleTypingStatus,
  };
};
