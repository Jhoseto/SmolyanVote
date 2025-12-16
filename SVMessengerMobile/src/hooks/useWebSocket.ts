/**
 * useWebSocket Hook
 * Hook за управление на WebSocket connection и subscriptions
 */

import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { stompClient } from '../services/websocket/stompClient';
import { useAuthStore } from '../store/authStore';
import { useMessagesStore } from '../store/messagesStore';
import { useConversationsStore } from '../store/conversationsStore';
import { useCallsStore } from '../store/callsStore';
import { Message, TypingStatus, MessageType } from '../types/message';
import { Conversation } from '../types/conversation';
import { CallState } from '../types/call';

export const useWebSocket = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { addMessage, setTyping, updateMessage } = useMessagesStore();
  const { updateConversation, incrementUnreadCount } = useConversationsStore();
  const { setCallState, startCall } = useCallsStore();
  const subscriptionsRef = useRef<Map<string, any>>(new Map());

  // Subscribe to user-specific channels
  // Spring STOMP автоматично мапва /user/queue/... към правилния user на базата на authentication
  // Използваме същия формат като web приложението: /user/queue/... (без username в path)
  const subscribeToChannels = useCallback(() => {
    if (!user) {
      console.log('WebSocket: Cannot subscribe - no user');
      return;
    }

    if (!stompClient.getConnected()) {
      console.log('WebSocket: Cannot subscribe - not connected');
      return;
    }

    // Subscribe to private messages
    const messagesSubscription = stompClient.subscribe(
      '/user/queue/svmessenger-messages',
      (data: any) => {
        try {
          console.log('✅ WebSocket message received:', data);
          
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
          };
          
          console.log('✅ Adding message to store:', message.id, 'for conversation:', message.conversationId);
          addMessage(message.conversationId, message);
          
          // Update conversation with last message
          updateConversation(message.conversationId, {
            lastMessage: {
              text: message.text,
              createdAt: message.createdAt,
            },
            updatedAt: message.createdAt,
          });
          
          // Increment unread count if message is from other user
          if (message.senderId !== user.id) {
            incrementUnreadCount(message.conversationId);
          }
          
          console.log('✅ Message processed successfully');
        } catch (error) {
          console.error('❌ Error processing WebSocket message:', error, data);
        }
      }
    );

    if (messagesSubscription) {
      subscriptionsRef.current.set('messages', messagesSubscription);
    }

    // Typing status се изпраща към topic за всеки conversation
    // Ще се subscribe-ваме динамично когато се отвори conversation (в useMessages hook)
    // Тук не се subscribe-ваме защото не знаем кои conversations са активни

    // Subscribe to read receipts
    // Backend изпраща към /queue/svmessenger-read-receipts (с 's' в края)
    const readReceiptSubscription = stompClient.subscribe(
      '/user/queue/svmessenger-read-receipts',
      (data: { messageId?: number; conversationId: number; readAt: string; type?: string }) => {
        if (data.type === 'BULK_READ') {
          // Bulk read - маркира всички съобщения в разговора като прочетени
          const { messages } = useMessagesStore.getState();
          const conversationMessages = messages[data.conversationId] || [];
          conversationMessages.forEach((msg) => {
            updateMessage(data.conversationId, msg.id, {
              isRead: true,
              readAt: data.readAt,
            });
          });
        } else if (data.messageId) {
          // Individual message read receipt
          updateMessage(data.conversationId, data.messageId, {
            isRead: true,
            readAt: data.readAt,
          });
        }
      }
    );

    if (readReceiptSubscription) {
      subscriptionsRef.current.set('readReceipt', readReceiptSubscription);
    }

    // Subscribe to delivery receipts
    // Backend изпраща към /queue/svmessenger-delivery-receipts (с 's' в края)
    const deliveryReceiptSubscription = stompClient.subscribe(
      '/user/queue/svmessenger-delivery-receipts',
      (data: { messageId?: number; conversationId?: number; conversationIds?: number[]; deliveredAt: string; type?: string }) => {
        if (data.type === 'BULK_DELIVERY' && data.conversationIds) {
          // Bulk delivery - маркира всички не-delivered съобщения в засегнатите conversations като delivered
          const { messages } = useMessagesStore.getState();
          data.conversationIds.forEach((convId) => {
            const conversationMessages = messages[convId] || [];
            conversationMessages.forEach((msg) => {
              if (!msg.isDelivered) {
                updateMessage(convId, msg.id, {
                  isDelivered: true,
                  deliveredAt: data.deliveredAt,
                });
              }
            });
          });
        } else if (data.messageId && data.conversationId) {
          // Individual message delivery receipt
          updateMessage(data.conversationId, data.messageId, {
            isDelivered: true,
            deliveredAt: data.deliveredAt,
          });
        }
      }
    );

    if (deliveryReceiptSubscription) {
      subscriptionsRef.current.set('deliveryReceipt', deliveryReceiptSubscription);
    }

    // Subscribe to online status updates (broadcast topic, not user queue)
    const onlineStatusSubscription = stompClient.subscribe(
      '/topic/svmessenger-online-status',
      (data: { userId: number; isOnline: boolean; timestamp?: string }) => {
        // Update conversation participant online status
        const { conversations } = useConversationsStore.getState();
        conversations.forEach((conv) => {
          if (conv.participant?.id === data.userId) {
            updateConversation(conv.id, {
              participant: {
                ...conv.participant,
                isOnline: data.isOnline,
              },
            });
          }
        });
      }
    );

    if (onlineStatusSubscription) {
      subscriptionsRef.current.set('onlineStatus', onlineStatusSubscription);
    }

    // Subscribe to call signals
    const callSignalSubscription = stompClient.subscribe(
      '/user/queue/svmessenger-call-signals',
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
          startCall(
            data.conversationId,
            data.callerId,
            data.callerName || 'Unknown',
            data.callerAvatar
          );
          setCallState(CallState.INCOMING);
        } else if (data.eventType === 'CALL_ANSWERED') {
          setCallState(CallState.CONNECTING);
        } else if (data.eventType === 'CALL_REJECTED' || data.eventType === 'CALL_ENDED') {
          setCallState(CallState.DISCONNECTED);
        }
      }
    );

    if (callSignalSubscription) {
      subscriptionsRef.current.set('callSignal', callSignalSubscription);
    }
  }, [user, addMessage, setTyping, updateMessage, updateConversation, setCallState, startCall]);

  // Connect to WebSocket
  const connect = useCallback(async () => {
    if (!isAuthenticated || !user) {
      console.log('WebSocket: Skipping connection - not authenticated or no user');
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
          // Не хвърляме грешка, за да не crash-не приложението
        }
      );
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      // Не хвърляме грешка, за да не crash-не приложението
    }
  }, [isAuthenticated, user, subscribeToChannels]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    try {
      subscriptionsRef.current.forEach((subscription) => {
        try {
          subscription?.unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing:', error);
        }
      });
      subscriptionsRef.current.clear();
      stompClient.disconnect();
    } catch (error) {
      console.error('Error disconnecting WebSocket:', error);
    }
  }, []);


  // Subscribe to typing status for a specific conversation
  // Backend изпраща към /topic/svmessenger-typing/{conversationId}
  const subscribeToTypingStatus = useCallback(
    (conversationId: number) => {
      if (!stompClient.getConnected()) return;

      const topic = `/topic/svmessenger-typing/${conversationId}`;
      const key = `typing-${conversationId}`;

      // Unsubscribe from previous subscription if exists
      const existingSubscription = subscriptionsRef.current.get(key);
      if (existingSubscription) {
        try {
          existingSubscription.unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing from typing status:', error);
        }
      }

      const subscription = stompClient.subscribe(
        topic,
        (data: { conversationId: number; userId: number; isTyping: boolean }) => {
          setTyping(data.conversationId, data.userId, data.isTyping);
        }
      );

      if (subscription) {
        subscriptionsRef.current.set(key, subscription);
      }
    },
    [setTyping]
  );

  // Unsubscribe from typing status for a specific conversation
  const unsubscribeFromTypingStatus = useCallback(
    (conversationId: number) => {
      const key = `typing-${conversationId}`;
      const subscription = subscriptionsRef.current.get(key);
      if (subscription) {
        try {
          subscription.unsubscribe();
          subscriptionsRef.current.delete(key);
        } catch (error) {
          console.error('Error unsubscribing from typing status:', error);
        }
      }
    },
    []
  );

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

  // Send read receipt - маркира целия разговор като прочетен
  // Backend endpoint: /app/svmessenger/mark-read
  const sendReadReceipt = useCallback(
    (conversationId: number, messageId?: number) => {
      if (!stompClient.getConnected()) return;

      // Backend очаква само conversationId за mark-read
      stompClient.send('/app/svmessenger/mark-read', {
        conversationId,
        isTyping: false, // Backend използва SVTypingStatusDTO, но isTyping не се използва
      });
    },
    []
  );

  // Effect: Connect on mount, disconnect on unmount
  useEffect(() => {
    if (isAuthenticated && user) {
      // Изчакваме 2 секунди преди да се свържем, за да се уверим че:
      // 1. Token е запазен правилно
      // 2. Token е refresh-нат ако е изтекъл
      // 3. API call-овете са завършени
      const timeoutId = setTimeout(() => {
        connect();
      }, 2000);

      return () => {
        clearTimeout(timeoutId);
        disconnect();
      };
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, user, connect, disconnect]);

  // WebSocket остава активен в background за real-time нотификации
  // При app state change само reconnect ако не е connected
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App стана active - reconnect WebSocket ако не е connected
        if (!stompClient.getConnected()) {
          connect();
        } else {
          // Refresh subscriptions ако вече е connected
          subscribeToChannels();
        }
      }
      // НЕ затваряме WebSocket в background - остава активен за real-time нотификации
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isAuthenticated, user, connect, subscribeToChannels]);

  return {
    isConnected: stompClient.getConnected(),
    sendTypingStatus,
    sendReadReceipt,
    subscribeToTypingStatus,
    unsubscribeFromTypingStatus,
    reconnect: connect,
  };
};

