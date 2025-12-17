/**
 * useMessages Hook
 * Hook за управление на messages в конкретен conversation
 */

import { useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useMessagesStore } from '../store/messagesStore';
import { useWebSocket } from './useWebSocket';
import { useConversationsStore } from '../store/conversationsStore';
import { soundService } from '../services/sounds/soundService';

export const useMessages = (conversationId: number) => {
  const {
    messages,
    isLoading,
    error,
    fetchMessages,
    sendMessage,
    typingUsers,
    pagination,
    loadMoreMessages,
  } = useMessagesStore();

  const { sendTypingStatus, sendReadReceipt, subscribeToTypingStatus, unsubscribeFromTypingStatus } = useWebSocket();
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

  // ✅ Refresh messages when app becomes active (за да се виждат новите съобщения веднага)
  useEffect(() => {
    if (!conversationId) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App стана active - refresh messages за да се виждат новите съобщения
        console.log('📱 App became active, refreshing messages for conversation:', conversationId);
        fetchMessages(conversationId);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [conversationId, fetchMessages]);

  // Subscribe to typing status for this conversation
  useEffect(() => {
    if (conversationId) {
      subscribeToTypingStatus(conversationId);
      return () => {
        unsubscribeFromTypingStatus(conversationId);
      };
    }
  }, [conversationId, subscribeToTypingStatus, unsubscribeFromTypingStatus]);

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
    async (text: string, parentMessageId?: number) => {
      // Stop typing
      sendTypingStatus(conversationId, false);

      // Try WebSocket first
      try {
        const { stompClient } = require('../services/websocket/stompClient');
        if (stompClient.getConnected()) {
          try {
            // Send via WebSocket - server will send back via WebSocket to both sender and recipient
            stompClient.send('/app/svmessenger/send', {
              conversationId,
              text,
              parentMessageId,
            });
            
            // Не добавяме optimistic message тук - ще получим реалното съобщение от server през WebSocket
            // Това гарантира че няма дубликати и че всички данни са правилни
            return null; // Message ще дойде през WebSocket
          } catch (error) {
            console.error('WebSocket send failed, using REST:', error);
            // Fallback to REST API
            return await sendMessage(conversationId, text, parentMessageId);
          }
        } else {
          // WebSocket not connected, use REST API
          return await sendMessage(conversationId, text, parentMessageId);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        // Fallback to REST API
        return await sendMessage(conversationId, text, parentMessageId);
      }
    },
    [conversationId, sendMessage, sendTypingStatus]
  );

  const conversationPagination = pagination[conversationId] || {
    currentPage: 0,
    hasMore: false,
    isLoadingMore: false,
  };

  return {
    messages: conversationMessages,
    isLoading,
    error,
    isTyping,
    sendMessage: handleSendMessage,
    handleTyping,
    refreshMessages: () => fetchMessages(conversationId, 0, 50, false),
    loadMoreMessages: () => loadMoreMessages(conversationId),
    hasMore: conversationPagination.hasMore,
    isLoadingMore: conversationPagination.isLoadingMore,
  };
};

