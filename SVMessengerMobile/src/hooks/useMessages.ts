/**
 * useMessages Hook
 * Hook за управление на messages в конкретен conversation
 */

import React, { useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useMessagesStore } from '../store/messagesStore';
import { useWebSocket } from './useWebSocket';
import { useConversationsStore } from '../store/conversationsStore';
import { useAuthStore } from '../store/authStore';
import { soundService } from '../services/sounds/soundService';
import { logger } from '../utils/logger';
import { MessageType } from '../types/message';

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
    addMessage,
    removeMessage,
  } = useMessagesStore();

  const { sendTypingStatus, sendReadReceipt, subscribeToTypingStatus, unsubscribeFromTypingStatus } = useWebSocket();
  const { markAsRead, selectConversation, conversations } = useConversationsStore();
  const { user } = useAuthStore();

  const conversationMessages = messages[conversationId] || [];
  // CRITICAL FIX: Filter out current user from typing users
  // We only want to show typing indicator when OTHER users are typing, not ourselves
  const typingUsersForConversation = typingUsers[conversationId] || [];
  const otherUsersTyping = typingUsersForConversation.filter(userId => userId !== user?.id);
  const isTyping = otherUsersTyping.length > 0;

  // Track optimistic message timeouts for cleanup
  const optimisticMessageTimeoutsRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

  // CRITICAL FIX: Counter for generating unique optimistic message IDs
  // Prevents collisions when multiple messages are sent within the same millisecond
  const optimisticMessageCounterRef = useRef<number>(0);

  // Fetch messages on mount and select conversation
  // CRITICAL FIX Bug 1: Don't include currentUnreadCount in dependencies - it causes unnecessary re-fetches
  // Only fetch when conversationId changes, not when unread count updates
  useEffect(() => {
    if (conversationId) {
      // Select conversation first to mark it as open (prevents unread count increment)
      selectConversation(conversationId);

      // Get current conversation's unread count from store (don't add to dependencies)
      const currentConversation = conversations.find(c => c.id === conversationId);
      const currentUnreadCount = currentConversation?.unreadCount || 0;

      // Mark as read immediately if conversation has unread messages (exactly like web version)
      if (currentUnreadCount > 0) {
        markAsRead(conversationId).catch(error => {
          logger.error('Failed to mark as read:', error);
        });
        sendReadReceipt(conversationId);
      }

      // CRITICAL: Load only last 30 messages initially (like Facebook Messenger)
      // Older messages will lazy-load when user scrolls up
      logger.info(`📥 [useMessages] Fetching messages for conversation ${conversationId}`);
      fetchMessages(conversationId, 0, 30, false); // Load last 30 messages, don't append
    } else {
      // Deselect when conversationId is null
      selectConversation(null);
    }
    // CRITICAL FIX Bug 1: Remove currentUnreadCount and fetchMessages from dependencies
    // conversationId is sufficient to track when to fetch messages
    // Store actions don't have stable references and unread count changes shouldn't trigger re-fetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, selectConversation, markAsRead, sendReadReceipt]);

  // Cleanup optimistic message timeouts when conversation changes or component unmounts
  useEffect(() => {
    return () => {
      // Clear all pending timeouts when conversation changes or component unmounts
      optimisticMessageTimeoutsRef.current.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      optimisticMessageTimeoutsRef.current.clear();
    };
  }, [conversationId]);

  // CRITICAL FIX: Cleanup timeouts for optimistic messages that were removed (e.g., when real message arrived)
  // This prevents orphaned timeouts from executing after optimistic message is already replaced
  useEffect(() => {
    const currentMessages = messages[conversationId] || [];
    const currentOptimisticIds = currentMessages
      .filter(m => m.id < 0)
      .map(m => m.id);

    // Clear timeouts for optimistic messages that no longer exist
    optimisticMessageTimeoutsRef.current.forEach((timeoutId, optimisticId) => {
      if (!currentOptimisticIds.includes(optimisticId)) {
        // Optimistic message was removed (real message arrived), clear its timeout
        clearTimeout(timeoutId);
        optimisticMessageTimeoutsRef.current.delete(optimisticId);
      }
    });
  }, [conversationId, messages]);

  // ✅ Refresh messages when app becomes active (за да се виждат новите съобщения веднага)
  useEffect(() => {
    if (!conversationId) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App стана active - refresh messages за да се виждат новите съобщения
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
        markAsRead(conversationId).catch(error => {
          logger.error('Failed to mark as read:', error);
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
      if (!user) return null;

      // Stop typing
      sendTypingStatus(conversationId, false);

      // CRITICAL FIX: Add optimistic message immediately for instant UI feedback
      // Use temporary negative ID that will be replaced when real message arrives
      // CRITICAL FIX: Use timestamp + counter to ensure uniqueness even for synchronous sends
      // Date.now() has millisecond precision, so multiple messages sent in the same millisecond
      // would get identical IDs without the counter. The counter increments for each message,
      // ensuring each optimistic message has a unique ID even if sent within the same millisecond.
      optimisticMessageCounterRef.current += 1;
      const tempMessageId = -Date.now() * 10000 - optimisticMessageCounterRef.current;
      const optimisticMessage = {
        id: tempMessageId,
        conversationId,
        senderId: user.id,
        text,
        createdAt: new Date().toISOString(),
        isRead: false,
        isDelivered: false,
        readAt: undefined,
        deliveredAt: undefined,
        type: MessageType.TEXT,
        isEdited: false,
        editedAt: undefined,
        parentMessageId,
        parentMessageText: undefined,
      };

      // Add optimistic message immediately
      addMessage(conversationId, optimisticMessage);

      // Try WebSocket first
      try {
        const { svMobileWebSocketService } = require('../services/websocket/stompClient');
        if (svMobileWebSocketService.isConnected()) {
          try {
            // CRITICAL FIX Bug 2: Include parentMessageId for reply functionality
            // CRITICAL FIX Bug 1: Check return value - if send fails, remove optimistic message and fallback to REST
            const sendSuccess = svMobileWebSocketService.sendMessage(conversationId, text, 'TEXT', parentMessageId);

            if (sendSuccess) {
              // Real message will arrive via WebSocket and replace optimistic message
              // The real message will have a positive ID, so it won't conflict
              // When real message arrives, we'll remove the optimistic one

              // CRITICAL FIX: Set timeout to cleanup orphaned optimistic message if real message never arrives
              // This prevents optimistic messages from remaining in UI indefinitely if WebSocket fails silently
              const timeoutId = setTimeout(() => {
                // Check if optimistic message still exists (wasn't replaced by real message)
                const storeState = useMessagesStore.getState();
                const conversationMessages = storeState.messages[conversationId] || [];
                const stillExists = conversationMessages.some(m => m.id === tempMessageId);

                if (stillExists) {
                  // CRITICAL FIX Bug 1: Before retrying via REST, check if real message already arrived
                  // This prevents race condition where real WebSocket message arrives between
                  // removing optimistic message and sending REST retry, causing duplicate messages
                  const realMessageExists = conversationMessages.some(m =>
                    m.id > 0 && // Real message has positive ID
                    m.text === text && // Same text
                    m.senderId === user.id && // Same sender
                    (m.parentMessageId === parentMessageId ||
                      (m.parentMessageId == null && parentMessageId == null)) // Same parent (if any)
                  );

                  if (realMessageExists) {
                    // Real message already arrived - just remove optimistic and don't retry
                    logger.debug(`✅ [useMessages] Real message already arrived for optimistic ${tempMessageId}, removing optimistic without REST retry`);
                    removeMessage(conversationId, tempMessageId);
                  } else {
                    // Real message hasn't arrived - remove optimistic and retry via REST
                    logger.warn(`⚠️ [useMessages] Optimistic message ${tempMessageId} not confirmed after 15s, removing and retrying via REST`);
                    // Remove orphaned optimistic message
                    removeMessage(conversationId, tempMessageId);

                    // Retry via REST API as fallback
                    sendMessage(conversationId, text, parentMessageId).catch((error) => {
                      logger.error('❌ [useMessages] REST fallback after optimistic timeout failed:', error);
                    });
                  }
                }

                // Clean up timeout reference
                optimisticMessageTimeoutsRef.current.delete(tempMessageId);
              }, 15000); // 15 seconds timeout - reasonable for network delays

              // Store timeout for potential cleanup
              optimisticMessageTimeoutsRef.current.set(tempMessageId, timeoutId);

              return optimisticMessage;
            } else {
              // WebSocket send failed (returned false) - remove optimistic message and fallback to REST
              logger.error('WebSocket send returned false, using REST fallback');
              // Clear any pending timeout
              const existingTimeout = optimisticMessageTimeoutsRef.current.get(tempMessageId);
              if (existingTimeout) {
                clearTimeout(existingTimeout);
                optimisticMessageTimeoutsRef.current.delete(tempMessageId);
              }
              removeMessage(conversationId, tempMessageId);
              return await sendMessage(conversationId, text, parentMessageId);
            }
          } catch (error) {
            logger.error('WebSocket send failed with exception, using REST:', error);
            // Clear any pending timeout
            const existingTimeout = optimisticMessageTimeoutsRef.current.get(tempMessageId);
            if (existingTimeout) {
              clearTimeout(existingTimeout);
              optimisticMessageTimeoutsRef.current.delete(tempMessageId);
            }
            // Remove optimistic message on error
            removeMessage(conversationId, tempMessageId);
            // Fallback to REST API
            return await sendMessage(conversationId, text, parentMessageId);
          }
        } else {
          // WebSocket not connected, use REST API
          // Clear any pending timeout (shouldn't exist, but be safe)
          const existingTimeout = optimisticMessageTimeoutsRef.current.get(tempMessageId);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
            optimisticMessageTimeoutsRef.current.delete(tempMessageId);
          }
          // Remove optimistic message - REST will return real message
          removeMessage(conversationId, tempMessageId);
          return await sendMessage(conversationId, text, parentMessageId);
        }
      } catch (error) {
        logger.error('Error sending message:', error);
        // Clear any pending timeout
        const existingTimeout = optimisticMessageTimeoutsRef.current.get(tempMessageId);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
          optimisticMessageTimeoutsRef.current.delete(tempMessageId);
        }
        // Remove optimistic message on error
        removeMessage(conversationId, tempMessageId);
        // Fallback to REST API
        return await sendMessage(conversationId, text, parentMessageId);
      }
    },
    [conversationId, sendMessage, sendTypingStatus, user, addMessage, removeMessage]
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
    refreshMessages: () => fetchMessages(conversationId, 0, 30, false),
    loadMoreMessages: () => loadMoreMessages(conversationId),
    hasMore: conversationPagination.hasMore,
    isLoadingMore: conversationPagination.isLoadingMore,
  };
};

