/**
 * useMessages Hook
 * Hook за управление на messages в конкретен conversation
 */

import { useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useMessagesStore } from '../store/messagesStore';
import { useWebSocket } from './useWebSocket';
import { useConversationsStore } from '../store/conversationsStore';
import { useAuthStore } from '../store/authStore';
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
  const { markAsRead, selectConversation } = useConversationsStore();
  const { user } = useAuthStore();

  const conversationMessages = messages[conversationId] || [];
  const isTyping = (typingUsers[conversationId] || []).length > 0;

  // Fetch messages on mount and select conversation
  useEffect(() => {
    if (conversationId) {
      // Select conversation first to mark it as open (prevents unread count increment)
      selectConversation(conversationId);
      
      // Mark as read immediately if conversation has unread messages (exactly like web version)
      const { conversations } = useConversationsStore.getState();
      const conversation = conversations.find(c => c.id === conversationId);
      
      if (conversation && (conversation.unreadCount || 0) > 0) {
        console.log('📖 Chat opened with unread messages, marking as read immediately');
        markAsRead(conversationId).catch(error => {
          console.error('Failed to mark as read:', error);
        });
        sendReadReceipt(conversationId);
      }
      
      fetchMessages(conversationId);
    } else {
      // Deselect when conversationId is null
      selectConversation(null);
    }
  }, [conversationId, selectConversation, markAsRead, sendReadReceipt]);

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

  // Mark conversation as read when messages are loaded (backup check - exactly like web version)
  // This ensures that if messages are loaded and there are unread messages, we mark them as read
  useEffect(() => {
    if (conversationId && conversationMessages.length > 0 && user) {
      // Check if there are unread messages from other users
      const hasUnreadMessages = conversationMessages.some(
        m => m.senderId !== user.id && !m.isRead
      );

      if (hasUnreadMessages) {
        console.log('📖 Unread messages detected after loading, marking as read');
        markAsRead(conversationId).catch(error => {
          console.error('Failed to mark as read:', error);
        });
        sendReadReceipt(conversationId);
      }
    }
  }, [conversationId, conversationMessages.length, user, markAsRead, sendReadReceipt]);

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

