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
import { Message, TypingStatus } from '../types/message';
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
      (message: Message) => {
        console.log('Received message:', message);
        addMessage(message.conversationId, message);
        updateConversation(message.conversationId, {
          lastMessage: message,
        });
      }
    );

    if (messagesSubscription) {
      subscriptionsRef.current.set('messages', messagesSubscription);
    }

    // Subscribe to typing status
    const typingSubscription = stompClient.subscribe(
      '/user/queue/svmessenger-typing',
      (data: { conversationId: number; userId: number; isTyping: boolean }) => {
        setTyping(data.conversationId, data.userId, data.isTyping);
      }
    );

    if (typingSubscription) {
      subscriptionsRef.current.set('typing', typingSubscription);
    }

    // Subscribe to read receipts
    // Backend изпраща към /queue/svmessenger-read-receipts (с 's' в края)
    const readReceiptSubscription = stompClient.subscribe(
      '/user/queue/svmessenger-read-receipts',
      (data: { messageId?: number; conversationId: number; readAt: string; type?: string }) => {
        if (data.type === 'BULK_READ') {
          // Bulk read - маркира всички съобщения в разговора като прочетени
          // Това ще се обработи от conversations store
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
    const onlineStatusSubscription = stompClient.subscribe(
      '/user/queue/svmessenger-online-status',
      (data: { userId: number; isOnline: boolean }) => {
        // Update conversation participant online status
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

  // Оптимизация: Управление на WebSocket според AppState (затваряне в background за по-малко батерия)
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      try {
        if (nextAppState === 'active') {
          // App става active - свържи WebSocket
          if (!stompClient.getConnected()) {
            console.log('App became active, connecting WebSocket...');
            connect();
          }
        } else if (nextAppState === 'background' || nextAppState === 'inactive') {
          // App отива в background - затвори WebSocket за по-малко батерия
          if (stompClient.getConnected()) {
            console.log('App went to background, disconnecting WebSocket to save battery...');
            disconnect();
          }
        }
      } catch (error) {
        console.error('Error handling app state change:', error);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, user, connect, disconnect]);

  return {
    isConnected: stompClient.getConnected(),
    sendTypingStatus,
    sendReadReceipt,
    reconnect: connect,
  };
};

