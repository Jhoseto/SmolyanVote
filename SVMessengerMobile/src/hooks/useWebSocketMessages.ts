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

export const useWebSocketMessages = () => {
  const { user } = useAuthStore();
  const { addMessage, updateMessage } = useMessagesStore();
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

  // Handle incoming messages
  const handleNewMessage = useCallback((data: any) => {
    if (!user) return;

    console.log('📨 WebSocket: New message received via WebSocket');
    console.log('📨 Message data:', {
      id: data.id,
      conversationId: data.conversationId,
      senderId: data.senderId,
      text: data.text?.substring(0, 50) + '...',
    });

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

    console.log('📨 Adding message to store:', message.id, 'for conversation:', message.conversationId);

    // Add message to store (will trigger UI update)
    addMessage(message.conversationId, message);

    // Update conversation list immediately (exactly like web version)
    const conversationExists = conversations.some(c => c.id === message.conversationId);

    // Handle unread count based on conversation state (exactly like web version)
    if (message.senderId !== user.id) {
      if (selectedConversationId === message.conversationId) {
        // Conversation is currently open - update lastMessage but don't increment unread count
        console.log('📨 Message received for currently open conversation, marking as read');
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
        console.log('📨 Message received for closed conversation, updating and incrementing unread count');

        if (conversationExists) {
          // Conversation exists - update last message and increment unread count
          updateConversationWithNewMessage(message.conversationId, message.text, message.createdAt, true); // incrementUnread = true
        } else {
          // Conversation doesn't exist - fetch and add conversation to list (exactly like web version)
          console.log('📨 Conversation not found, fetching conversation details');
          getConversation(message.conversationId).then(conv => {
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
          }).catch(error => {
            console.error('Error fetching conversation details:', error);
          });
        }
      }

      // Play notification sound for new messages
      soundService.playSound('notification');
    }
  }, [user, addMessage, conversations, selectedConversationId, updateConversation, updateConversationWithNewMessage, getConversation, addConversation]);

  // Handle delivery receipts
  const handleDeliveryReceipt = useCallback((data: any) => {
    console.log('📬 WebSocket: Delivery receipt received:', data);

    // Mark message as delivered
    updateMessage(data.conversationId, data.messageId, {
      isDelivered: true,
      deliveredAt: data.deliveredAt || new Date().toISOString(),
    });
  }, [updateMessage]);

  // Handle read receipts
  const handleReadReceipt = useCallback((data: any) => {
    console.log('📖 WebSocket: Read receipt received:', data);

    if (data.conversationId) {
      // Conversation-level read receipt (mark entire conversation as read)
      console.log('📖 Marking entire conversation as read:', data.conversationId);

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

  // Send read receipt
  const sendReadReceipt = useCallback((conversationId: number) => {
    return svMobileWebSocketService.sendReadReceipt(conversationId);
  }, []);

  // Send message
  const sendMessage = useCallback((conversationId: number, text: string, parentMessageId?: number) => {
    return svMobileWebSocketService.sendMessage(conversationId, text);
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
