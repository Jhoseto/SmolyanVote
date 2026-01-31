/**
 * useWebSocketMessages Hook
 * Обработка на WebSocket messages и receipts
 */

import { useEffect, useCallback, useRef } from 'react';
import { svMobileWebSocketService } from '../services/websocket/stompClient';
import { useAuthStore } from '../store/authStore';
import { useMessagesStore } from '../store/messagesStore';
import { useConversationsStore } from '../store/conversationsStore';
import { soundService } from '../services/sounds/soundService';
import { Message, MessageType } from '../types/message';
import { safeConsoleError, safeErrorToString } from '../utils/safeLog';
import { logger } from '../utils/logger';

export const useWebSocketMessages = () => {
  const { user } = useAuthStore();
  const { addMessage, updateMessage, removeMessage } = useMessagesStore();
  const {
    updateConversation,
    updateConversationWithNewMessage,
    incrementUnreadCount,
    conversations,
    selectedConversationId,
    getConversation,
    addConversation
  } = useConversationsStore();

  // Track subscriptions for cleanup
  const subscriptionsRef = useRef<any[]>([]);

  // Send read receipt (defined before handleNewMessage to avoid dependency issues)
  const sendReadReceipt = useCallback((conversationId: number) => {
    return svMobileWebSocketService.sendReadReceipt(conversationId);
  }, []);

  // Handle incoming messages
  const handleNewMessage = useCallback((data: any) => {
    if (!user) return;

    // Parse message from backend DTO format to mobile Message format
    const message: Message = {
      id: data.id,
      conversationId: data.conversationId,
      senderId: data.senderId,
      text: data.text || '',
      createdAt: data.sentAt || data.createdAt || new Date().toISOString(),
      isRead: data.isRead || false,
      isDelivered: data.isDelivered || false,
      readAt: data.readAt,
      deliveredAt: data.deliveredAt,
      type: (data.messageType || data.type || 'TEXT') as MessageType,
      parentMessageId: data.parentMessageId,
      parentMessageText: data.parentMessageText,
    };

    // CRITICAL FIX: Remove optimistic message if it exists before adding real message
    // Optimistic messages have negative IDs, so we check for messages with same text and senderId
    // CRITICAL FIX Bug 1: Match oldest optimistic message (lowest negative ID) to prevent incorrect matching
    // when user sends identical text twice rapidly - real message should match first optimistic message
    if (message.senderId === user.id) {
      // Access current messages from store without adding as dependency
      const storeState = useMessagesStore.getState();
      const conversationMessages = storeState.messages[message.conversationId] || [];
      // Find optimistic message with same text, senderId, and parentMessageId (oldest one - least negative ID)
      // This ensures that if user sends identical text twice rapidly, first real message matches first optimistic
      // CRITICAL FIX Bug 2: Also match by parentMessageId to prevent incorrect matching when user sends
      // identical text as replies to different messages
      // CRITICAL FIX Bug 1: Sort descending (b.id - a.id) to get least negative (oldest) first
      // Since temp IDs use -Date.now(), newer messages have lower (more negative) values
      // Example: -1000 (oldest) vs -2000 (newest)
      // Ascending: a.id - b.id = -1000 - (-2000) = 1000 (positive) → -2000 comes before -1000 ✗ (newest first)
      // Descending: b.id - a.id = -2000 - (-1000) = -1000 (negative) → -1000 comes before -2000 ✓ (oldest first)
      // CRITICAL FIX Bug 1: Match parentMessageId correctly - use strict null/undefined check
      // Treat undefined/null as "no parent", but allow 0 as valid parent ID
      // This prevents incorrect matching when message ID 0 is a valid parent
      const matchingOptimistic = conversationMessages.filter((m) =>
        m.id < 0 &&
        m.text === message.text &&
        m.senderId === message.senderId &&
        (m.parentMessageId === message.parentMessageId ||
          (m.parentMessageId == null && message.parentMessageId == null))
      );

      // CRITICAL FIX Bug 2: Find oldest optimistic message (least negative ID)
      // Since temp IDs use -Date.now(), older messages have less negative values (e.g., -1000)
      // and newer messages have more negative values (e.g., -2000)
      // We want the oldest (greatest/least negative ID), so use reduce to find max ID
      const optimisticMessage = matchingOptimistic.length > 0
        ? matchingOptimistic.reduce((oldest, current) => current.id > oldest.id ? current : oldest)
        : undefined;

      if (optimisticMessage) {
        // Remove optimistic message before adding real one
        removeMessage(message.conversationId, optimisticMessage.id);

        // CRITICAL FIX: Note that timeout cleanup is handled in useMessages hook
        // The timeout will check if real message already exists before retrying via REST
        // This prevents race condition where timeout fires after real message arrives
        logger.debug(`✅ [useWebSocketMessages] Real message ${message.id} arrived, replaced optimistic message ${optimisticMessage.id}`);
      }
    }

    // Add message to store (will trigger UI update)
    addMessage(message.conversationId, message);

    // Update conversation list immediately (exactly like web version)
    const conversationExists = conversations.some(c => c.id === message.conversationId);

    // Handle unread count based on conversation state (exactly like web version)
    if (message.senderId !== user.id) {
      if (selectedConversationId === message.conversationId) {
        // Conversation is currently open - update lastMessage but don't increment unread count
        if (conversationExists) {
          updateConversation(message.conversationId, {
            lastMessage: {
              text: message.text,
              createdAt: message.createdAt,
            },
            updatedAt: message.createdAt,
          });
        }
        sendReadReceipt(message.conversationId);
      } else {
        // Conversation is not open - update lastMessage AND increment unread count (exactly like web version)

        if (conversationExists) {
          // Conversation exists - update last message and increment unread count
          updateConversationWithNewMessage(message.conversationId, message.text, message.createdAt, true); // incrementUnread = true
        } else {
          // Conversation doesn't exist - fetch and add conversation to list (exactly like web version)

          // getConversation is async and always returns a Promise - call it directly
          // No need to check if it's a promise - it always is
          getConversation(message.conversationId)
            .then((conv: any) => {
              if (conv) {
                const alreadyExists = conversations.some(c => c.id === conv.id);

                if (alreadyExists) {
                  // Conversation already added, just update it
                  updateConversationWithNewMessage(conv.id, message.text, message.createdAt, true); // incrementUnread = true
                } else {
                  // Add new conversation with unreadCount incremented (exactly like web version)
                  addConversation({
                    ...conv,
                    unreadCount: (conv.unreadCount || 0) + 1,
                  });
                }
              }
            })
            .catch((error: any) => {
              logger.error('Error fetching conversation details:', error);
            });
        }
      }

      // Check if conversation is muted
      const conversation = conversations.find(c => c.id === message.conversationId);
      const isMuted = conversation?.mutedUntil ? new Date(conversation.mutedUntil) > new Date() : false;

      // CRITICAL UX: Play sound ONLY if:
      // 1. Conversation is NOT muted
      // 2. Chat with this person is NOT currently open (user would see message on screen)
      // This prevents annoying sound when actively chatting with someone
      const isChatOpen = selectedConversationId === message.conversationId;

      if (!isMuted && !isChatOpen) {
        soundService.playSound('notification');
      } else if (isChatOpen) {
        // User is actively viewing this chat - no sound needed (sees message immediately)
        logger.debug(`🔕 [useWebSocketMessages] Skipping sound - chat is open for conversation ${message.conversationId}`);
      }
    }
  }, [user, addMessage, conversations, selectedConversationId, updateConversation, updateConversationWithNewMessage, getConversation, addConversation, sendReadReceipt]);

  // Handle delivery receipts
  const handleDeliveryReceipt = useCallback((data: any) => {
    // Mark message as delivered
    updateMessage(data.conversationId, data.messageId, {
      isDelivered: true,
      deliveredAt: data.deliveredAt || new Date().toISOString(),
    });
  }, [updateMessage]);

  // Handle read receipts
  const handleReadReceipt = useCallback((data: any) => {
    if (data.conversationId) {
      // Conversation-level read receipt (mark entire conversation as read)

      // Reset unread count and recalculate total (exactly like web version)
      const updated = conversations.map(c =>
        c.id === data.conversationId ? { ...c, unreadCount: 0 } : c
      );

      // Update conversations in store
      // Note: This will trigger a re-render of the conversations list
    } else if (data.messageId) {
      // Individual message read receipt - decrease unread count by 1 (exactly like web version)
      const conversation = conversations.find(c => c.id === data.conversationId);

      if (conversation && (conversation.unreadCount || 0) > 0) {
        // Decrease unread count by 1
        updateConversation(data.conversationId, {
          unreadCount: Math.max(0, (conversation.unreadCount || 0) - 1),
        });
      }

      // Mark specific message as read
      updateMessage(data.conversationId, data.messageId, {
        isRead: true,
        readAt: data.readAt || new Date().toISOString(),
      });
    }
  }, [conversations, updateConversation, updateMessage]);

  // Send message
  // CRITICAL FIX Bug 2: Pass parentMessageId to WebSocket service for reply functionality
  const sendMessage = useCallback((conversationId: number, text: string, parentMessageId?: number) => {
    return svMobileWebSocketService.sendMessage(conversationId, text, 'TEXT', parentMessageId);
  }, []);

  // Send typing status
  const sendTypingStatus = useCallback((conversationId: number, isTyping: boolean) => {
    return svMobileWebSocketService.sendTypingStatus(conversationId, isTyping);
  }, []);

  // The new WebSocket service handles subscriptions automatically when connecting
  // We just need to provide callback functions during connection

  return {
    sendMessage,
    sendReadReceipt,
    sendTypingStatus,
    handleNewMessage,
    handleReadReceipt,
    handleDeliveryReceipt,
  };
};
