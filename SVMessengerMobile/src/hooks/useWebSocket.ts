/**
 * useWebSocket Hook
 * Hook за управление на WebSocket connection и subscriptions
 */

import { useEffect, useRef, useCallback } from 'react';
import { stompClient } from '../services/websocket/stompClient';
import { useAuthStore } from '../store/authStore';
import { useMessagesStore } from '../store/messagesStore';
import { useConversationsStore } from '../store/conversationsStore';
import { useCallsStore } from '../store/callsStore';
import { Message, TypingStatus } from '../types/message';
import { Conversation } from '../types/conversation';
import { CallState } from '../types/call';

export const useWebSocket = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { addMessage, setTyping, updateMessage } = useMessagesStore();
  const { updateConversation, incrementUnreadCount } = useConversationsStore();
  const { setCallState, startCall } = useCallsStore();
  const subscriptionsRef = useRef<Map<string, any>>(new Map());

  // Connect to WebSocket
  const connect = useCallback(async () => {
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      await stompClient.connect(
        () => {
          console.log('WebSocket connected');
          subscribeToChannels();
        },
        (error) => {
          console.error('WebSocket connection error:', error);
        }
      );
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }, [isAuthenticated, user]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    subscriptionsRef.current.forEach((subscription) => {
      subscription?.unsubscribe();
    });
    subscriptionsRef.current.clear();
    stompClient.disconnect();
  }, []);

  // Subscribe to user-specific channels
  // Backend използва username за routing, затова subscribe-ваме към /user/{username}/queue/...
  const subscribeToChannels = useCallback(() => {
    if (!user) return;

    const username = user.username;

    // Subscribe to private messages
    // Backend route: /user/{username}/queue/svmessenger-messages
    const messagesSubscription = stompClient.subscribe(
      `/user/${username}/queue/svmessenger-messages`,
      (message: Message) => {
        console.log('Received message:', message);
        addMessage(message.conversationId, message);
        
        // Update conversation
        updateConversation(message.conversationId, {
          lastMessage: message,
        });
      }
    );

    if (messagesSubscription) {
      subscriptionsRef.current.set('messages', messagesSubscription);
    }

    // Subscribe to typing status
    // Backend route: /user/{username}/queue/svmessenger-typing
    const typingSubscription = stompClient.subscribe(
      `/user/${username}/queue/svmessenger-typing`,
      (data: { conversationId: number; userId: number; isTyping: boolean }) => {
        setTyping(data.conversationId, data.userId, data.isTyping);
      }
    );

    if (typingSubscription) {
      subscriptionsRef.current.set('typing', typingSubscription);
    }

    // Subscribe to read receipts
    // Backend route: /user/{username}/queue/svmessenger-read-receipt
    const readReceiptSubscription = stompClient.subscribe(
      `/user/${username}/queue/svmessenger-read-receipt`,
      (data: { messageId: number; conversationId: number; readAt: string }) => {
        updateMessage(data.conversationId, data.messageId, {
          isRead: true,
          readAt: data.readAt,
        });
      }
    );

    if (readReceiptSubscription) {
      subscriptionsRef.current.set('readReceipt', readReceiptSubscription);
    }

    // Subscribe to delivery receipts
    // Backend route: /user/{username}/queue/svmessenger-delivery-receipt
    const deliveryReceiptSubscription = stompClient.subscribe(
      `/user/${username}/queue/svmessenger-delivery-receipt`,
      (data: { messageId: number; conversationId: number; deliveredAt: string }) => {
        updateMessage(data.conversationId, data.messageId, {
          isDelivered: true,
          deliveredAt: data.deliveredAt,
        });
      }
    );

    if (deliveryReceiptSubscription) {
      subscriptionsRef.current.set('deliveryReceipt', deliveryReceiptSubscription);
    }

    // Subscribe to online status updates
    // Backend route: /user/{username}/queue/svmessenger-online-status
    const onlineStatusSubscription = stompClient.subscribe(
      `/user/${username}/queue/svmessenger-online-status`,
      (data: { userId: number; isOnline: boolean }) => {
        // Update conversation participant online status
        // This will be handled by conversations store
      }
    );

    if (onlineStatusSubscription) {
      subscriptionsRef.current.set('onlineStatus', onlineStatusSubscription);
    }

    // Subscribe to call signals
    // Backend route: /user/{username}/queue/svmessenger-call-signals
    const callSignalSubscription = stompClient.subscribe(
      `/user/${username}/queue/svmessenger-call-signals`,
      (data: {
        conversationId: number;
        eventType: 'CALL_REQUEST' | 'CALL_ANSWERED' | 'CALL_REJECTED' | 'CALL_ENDED';
        callerId: number;
        receiverId: number;
        callerName?: string;
        callerAvatar?: string;
        roomName?: string;
      }) => {
        if (data.eventType === 'CALL_REQUEST') {
          // Incoming call
          startCall(
            data.conversationId,
            data.callerId,
            data.callerName || 'Unknown',
            data.callerAvatar
          );
          setCallState(CallState.INCOMING);
        } else if (data.eventType === 'CALL_ANSWERED') {
          // Call answered
          setCallState(CallState.CONNECTING);
        } else if (data.eventType === 'CALL_REJECTED' || data.eventType === 'CALL_ENDED') {
          // Call rejected or ended
          setCallState(CallState.DISCONNECTED);
        }
      }
    );

    if (callSignalSubscription) {
      subscriptionsRef.current.set('callSignal', callSignalSubscription);
    }
  }, [user, addMessage, setTyping, updateMessage, updateConversation, setCallState, startCall]);

  // Send typing status
  const sendTypingStatus = useCallback(
    (conversationId: number, isTyping: boolean) => {
      if (!stompClient.getConnected()) return;

      stompClient.send('/app/svmessenger/typing', {
        conversationId,
        isTyping,
      });
    },
    []
  );

  // Send read receipt
  const sendReadReceipt = useCallback(
    (conversationId: number, messageId: number) => {
      if (!stompClient.getConnected()) return;

      stompClient.send('/app/svmessenger/read-receipt', {
        conversationId,
        messageId,
      });
    },
    []
  );

  // Effect: Connect on mount, disconnect on unmount
  useEffect(() => {
    if (isAuthenticated) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, connect, disconnect]);

  return {
    isConnected: stompClient.getConnected(),
    sendTypingStatus,
    sendReadReceipt,
    reconnect: connect,
  };
};

