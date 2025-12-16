/**
 * useMessages Hook
 * Hook за управление на messages в конкретен conversation
 */

import { useEffect, useCallback } from 'react';
import { useMessagesStore } from '../store/messagesStore';
import { useWebSocket } from './useWebSocket';
import { useConversationsStore } from '../store/conversationsStore';

export const useMessages = (conversationId: number) => {
  const {
    messages,
    isLoading,
    error,
    fetchMessages,
    sendMessage,
    typingUsers,
  } = useMessagesStore();

  const { sendTypingStatus, sendReadReceipt } = useWebSocket();
  const { markAsRead } = useConversationsStore();

  const conversationMessages = messages[conversationId] || [];
  const isTyping = (typingUsers[conversationId] || []).length > 0;

  // Fetch messages on mount
  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId);
      markAsRead(conversationId);
    }
  }, [conversationId]);

  // Mark conversation as read when viewing
  useEffect(() => {
    if (conversationId && conversationMessages.length > 0) {
      markAsRead(conversationId);
      
      // Send read receipt за целия разговор (backend ще маркира всички съобщения)
      // Не изпращаме за всяко съобщение отделно, за да избегнем излишни заявки
      sendReadReceipt(conversationId);
    }
  }, [conversationId, conversationMessages.length, markAsRead, sendReadReceipt]);

  // Debounced typing indicator
  const handleTyping = useCallback(
    (text: string) => {
      if (text.length > 0) {
        sendTypingStatus(conversationId, true);
        
        // Stop typing after 3 seconds of inactivity
        setTimeout(() => {
          sendTypingStatus(conversationId, false);
        }, 3000);
      } else {
        sendTypingStatus(conversationId, false);
      }
    },
    [conversationId, sendTypingStatus]
  );

  const handleSendMessage = useCallback(
    async (text: string) => {
      // Stop typing
      sendTypingStatus(conversationId, false);

      // Try WebSocket first
      try {
        const { stompClient } = require('../services/websocket/stompClient');
        if (stompClient.getConnected()) {
          try {
            // Send via WebSocket
            stompClient.send('/app/svmessenger/send', {
              conversationId,
              text,
            });
            
            // Optimistically add message (will be updated when received from server)
            const optimisticMessage: Message = {
              id: Date.now(), // Temporary ID
              conversationId,
              senderId: 0, // Will be set by server
              text,
              createdAt: new Date().toISOString(),
              isRead: false,
              isDelivered: false,
              type: 'TEXT' as any,
            };
            
            // Add optimistic message using store hook
            const { addMessage: addMessageToStore } = useMessagesStore.getState();
            addMessageToStore(conversationId, optimisticMessage);
            
            // Return optimistic message - server will send real message via WebSocket
            return optimisticMessage;
          } catch (error) {
            console.error('WebSocket send failed, using REST:', error);
            // Fallback to REST API
            return await sendMessage(conversationId, text, false);
          }
        } else {
          // WebSocket not connected, use REST API
          return await sendMessage(conversationId, text, false);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        // Fallback to REST API
        return await sendMessage(conversationId, text, false);
      }
    },
    [conversationId, sendMessage, sendTypingStatus]
  );

  return {
    messages: conversationMessages,
    isLoading,
    error,
    isTyping,
    sendMessage: handleSendMessage,
    handleTyping,
    refreshMessages: () => fetchMessages(conversationId),
  };
};

