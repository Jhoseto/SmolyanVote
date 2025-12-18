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
import { soundService } from '../services/sounds/soundService';
import { Message, TypingStatus, MessageType } from '../types/message';
import { Conversation } from '../types/conversation';
import { CallState } from '../types/call';

export const useWebSocket = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { addMessage, setTyping, updateMessage } = useMessagesStore();
  const { updateConversation, updateConversationWithNewMessage, incrementUnreadCount, incrementMissedCalls } = useConversationsStore();
  const { setCallState, startCall } = useCallsStore();
  const subscriptionsRef = useRef<Map<string, any>>(new Map());

  // Subscribe to user-specific channels
  // Spring STOMP автоматично мапва /user/queue/... към правилния user на базата на authentication
  // Използваме същия формат като web приложението: /user/queue/... (без username в path)
  const subscribeToChannels = useCallback(() => {
    if (!user) {
      console.log('⚠️ WebSocket: Cannot subscribe - no user');
      return;
    }

    if (!stompClient.getConnected()) {
      console.log('⚠️ WebSocket: Cannot subscribe - not connected');
      return;
    }

    console.log('🔄 WebSocket: Subscribing to channels for user:', user.email || user.username);

    // Subscribe to private messages
    const messagesSubscription = stompClient.subscribe(
      '/user/queue/svmessenger-messages',
      (data: any) => {
        try {
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
          const store = useConversationsStore.getState();
          const { conversations, fetchConversations } = store;
          const conversationExists = conversations.some(c => c.id === message.conversationId);
          
          // Handle unread count based on conversation state (exactly like web version)
          if (message.senderId !== user.id) {
            const { selectedConversationId } = store;

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
                // Update existing conversation with lastMessage AND increment unreadCount in single update (exactly like web version)
                updateConversationWithNewMessage(
                  message.conversationId,
                  message.text,
                  message.createdAt,
                  true // incrementUnread = true
                );
              } else {
                // Conversation doesn't exist - fetch and add conversation to list (exactly like web version)
                console.log('📨 Conversation not found, fetching conversation details');
                const { getConversation } = useConversationsStore.getState();
                getConversation(message.conversationId).then(conv => {
                  if (conv) {
                    const { conversations } = useConversationsStore.getState();
                    const alreadyExists = conversations.some(c => c.id === conv.id);
                    
                    if (alreadyExists) {
                      // Conversation was added by another process, just update it
                      updateConversationWithNewMessage(
                        message.conversationId,
                        message.text,
                        message.createdAt,
                        true // incrementUnread = true
                      );
                    } else {
                      // Add new conversation with unreadCount incremented (exactly like web version)
                      const { addConversation } = useConversationsStore.getState();
                      addConversation({
                        ...conv,
                        unreadCount: (conv.unreadCount || 0) + 1,
                        lastMessage: {
                          text: message.text,
                          createdAt: message.createdAt,
                        },
                        updatedAt: message.createdAt,
                      });
                      // Note: addConversation already updates totalUnreadCount
                    }
                  }
                }).catch(error => {
                  console.error('Failed to fetch conversation:', error);
                });
              }
              
              // Play message sound
              soundService.playMessageSound();
            }
          } else {
            // Message from current user - just update lastMessage, no unread count change
            if (conversationExists) {
              updateConversation(message.conversationId, {
                lastMessage: {
                  text: message.text,
                  createdAt: message.createdAt,
                },
                updatedAt: message.createdAt,
              });
            }
          }
          
          console.log('✅ Message processed and added to store successfully');
        } catch (error) {
          console.error('❌ Error processing WebSocket message:', error);
          console.error('❌ Message data:', data);
        }
      }
    );
    
    if (messagesSubscription) {
      console.log('✅ Subscribed to /user/queue/svmessenger-messages');
      subscriptionsRef.current.set('messages', messagesSubscription);
    } else {
      console.error('❌ Failed to subscribe to /user/queue/svmessenger-messages');
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
          // Bulk read - маркира всички съобщения в разговора като прочетени (exactly like web version)
          const { messages } = useMessagesStore.getState();
          const conversationMessages = messages[data.conversationId] || [];
          conversationMessages.forEach((msg) => {
            updateMessage(data.conversationId, msg.id, {
              isRead: true,
              readAt: data.readAt,
            });
          });

          // Reset unread count and recalculate total (exactly like web version)
          const store = useConversationsStore.getState();
          const updated = store.conversations.map(c =>
            c.id === data.conversationId ? { ...c, unreadCount: 0 } : c
          );
          const totalUnread = updated.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
          useConversationsStore.setState({
            conversations: updated,
            totalUnreadCount: totalUnread,
          });
        } else if (data.messageId) {
          // Individual message read receipt - decrease unread count by 1 (exactly like web version)
          const { conversations } = useConversationsStore.getState();
          const conversation = conversations.find(c => c.id === data.conversationId);

          if (conversation && (conversation.unreadCount || 0) > 0) {
            const updated = conversations.map(c =>
              c.id === data.conversationId
                ? { ...c, unreadCount: Math.max(0, (c.unreadCount || 0) - 1) }
                : c
            );
            const totalUnread = updated.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
            useConversationsStore.setState({
              conversations: updated,
              totalUnreadCount: totalUnread,
            });
          }

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
        console.log('🟢 Online status update received:', {
          userId: data.userId,
          isOnline: data.isOnline,
        });
        
        // Update conversation participant online status
        const { conversations } = useConversationsStore.getState();
        let updated = false;
        conversations.forEach((conv) => {
          if (conv.participant?.id === data.userId) {
            console.log('🟢 Updating online status for conversation:', conv.id, 'participant:', data.userId, 'isOnline:', data.isOnline);
            updateConversation(conv.id, {
              participant: {
                ...conv.participant,
                isOnline: data.isOnline,
              },
            });
            updated = true;
          }
        });
        
        if (!updated) {
          console.log('⚠️ Online status update received but no matching conversation found for userId:', data.userId);
        }
      }
    );

    if (onlineStatusSubscription) {
      console.log('✅ Subscribed to /topic/svmessenger-online-status');
      subscriptionsRef.current.set('onlineStatus', onlineStatusSubscription);
    } else {
      console.error('❌ Failed to subscribe to /topic/svmessenger-online-status');
    }

    // Subscribe to call signals
    const callSignalSubscription = stompClient.subscribe(
      '/user/queue/svmessenger-call-signals',
      (data: {
        conversationId: number;
        eventType: 'CALL_REQUEST' | 'CALL_ACCEPT' | 'CALL_REJECT' | 'CALL_END';
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
          // Play incoming call sound
          soundService.playIncomingCallSound();
        } else if (data.eventType === 'CALL_ACCEPT') {
          // Stop incoming call sound when call is accepted
          soundService.stopIncomingCallSound();
          setCallState(CallState.CONNECTING);
        } else if (data.eventType === 'CALL_REJECT') {
          // If we rejected an incoming call, it's a missed call for the caller
          // If someone rejected our outgoing call, it's a missed call for us
          if (data.receiverId === user.id && data.eventType === 'CALL_REJECT') {
            // Someone rejected our call - not a missed call, just rejected
          } else if (data.callerId !== user.id) {
            // We rejected someone's call - increment missed calls for them
            incrementMissedCalls(data.conversationId);
          }
          setCallState(CallState.DISCONNECTED);
          // Stop all call sounds when call ends or is rejected
          soundService.stopIncomingCallSound();
          soundService.stopOutgoingCallSound();
        } else if (data.eventType === 'CALL_END') {
          setCallState(CallState.DISCONNECTED);
          // Stop all call sounds when call ends
          soundService.stopIncomingCallSound();
          soundService.stopOutgoingCallSound();
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
      console.log('⚠️ WebSocket: Skipping connection - not authenticated or no user');
      return;
    }

    if (stompClient.getConnected()) {
      console.log('✅ WebSocket: Already connected, refreshing subscriptions');
      subscribeToChannels();
      return;
    }

    console.log('🔄 WebSocket: Attempting to connect...');
    console.log('🔄 WebSocket: User:', user.email || user.username);
    
    try {
      await stompClient.connect(
        () => {
          console.log('✅ WebSocket: Connection successful, subscribing to channels...');
          console.log('✅ WebSocket: Backend will automatically update online status in database');
          // Изчакай малко преди да subscribe-неш за да се уверя че connection е напълно готов
          setTimeout(() => {
            subscribeToChannels();
          }, 500);
        },
        (error) => {
          console.error('❌ WebSocket connection error:', error);
          console.error('❌ WebSocket error details:', {
            message: error?.message,
            stack: error?.stack,
          });
          // Не хвърляме грешка, за да не crash-не приложението
        }
      );
    } catch (error) {
      console.error('❌ Failed to connect WebSocket:', error);
      console.error('❌ Connection error details:', {
        message: (error as Error)?.message,
        stack: (error as Error)?.stack,
      });
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
  // КРИТИЧНО: WebSocket трябва да се свърже ВЕДНАГА когато app се отвори за да се обнови online статус
  useEffect(() => {
    if (!isAuthenticated || !user) {
      console.log('⚠️ WebSocket: User not authenticated, skipping connection');
      return;
    }

    // Check if already connected to avoid multiple connections
    if (stompClient.getConnected()) {
      console.log('✅ WebSocket: Already connected, skipping');
      return;
    }

    console.log('🔄 WebSocket: User authenticated, connecting IMMEDIATELY...');
    console.log('🔄 WebSocket: User ID:', user.id, 'Email:', user.email);
    
    // КРИТИЧНО: Свързваме се ВЕДНАГА без забавяне за да се обнови online статус веднага
    // Token трябва да е вече запазен от auth flow
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 2000; // 2 секунди между опитите
    
    const attemptConnect = () => {
      if (stompClient.getConnected()) {
        console.log('✅ WebSocket: Already connected during retry, skipping');
        return;
      }
      
      console.log(`🔄 WebSocket: Connection attempt ${retryCount + 1}/${maxRetries}`);
      
      // Connect с callbacks за успех и грешка
      connect(
        () => {
          // Connection успешен - проверяваме дали наистина е connected
          setTimeout(() => {
            if (stompClient.getConnected()) {
              console.log('✅ WebSocket: Connection verified - online status will be updated by backend');
            } else {
              console.warn('⚠️ WebSocket: Connection callback called but not actually connected');
              if (retryCount < maxRetries - 1) {
                retryCount++;
                setTimeout(attemptConnect, retryDelay);
              }
            }
          }, 1000);
        },
        (error) => {
          // Connection failed - retry ако има още опити
          console.error(`❌ WebSocket: Connection attempt ${retryCount + 1} failed:`, error);
          if (retryCount < maxRetries - 1) {
            retryCount++;
            setTimeout(attemptConnect, retryDelay);
          } else {
            console.error('❌ WebSocket: Max retries reached, giving up');
          }
        }
      );
    };
    
    // Първи опит веднага
    attemptConnect();

    return () => {
      // Don't disconnect on cleanup - WebSocket should stay connected
      // Only disconnect on logout
    };
  }, [isAuthenticated, user, connect]);

  // WebSocket остава активен в background за real-time нотификации
  // При app state change КРИТИЧНО: reconnect ако не е connected за да се обнови online статус
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('📱 App became active - CRITICAL: Ensuring WebSocket connection for online status');
        console.log('📱 WebSocket connection status:', stompClient.getConnected());
        
        // КРИТИЧНО: App стана active - reconnect WebSocket ако не е connected
        // Това гарантира че online статус се обновява веднага
        if (!stompClient.getConnected()) {
          console.log('📱 WebSocket not connected, reconnecting IMMEDIATELY...');
          console.log('📱 User ID:', user.id, 'Email:', user.email);
          
          // Reconnect веднага без забавяне
          connect(
            () => {
              console.log('✅ WebSocket reconnected successfully - online status will be updated by backend');
              // Refresh subscriptions след reconnect
              setTimeout(() => {
                subscribeToChannels();
              }, 500);
            },
            (error) => {
              console.error('❌ WebSocket reconnection failed:', error);
              // Retry after 2 seconds
              setTimeout(() => {
                if (!stompClient.getConnected()) {
                  console.log('📱 Retrying WebSocket reconnection...');
                  connect();
                }
              }, 2000);
            }
          );
        } else {
          console.log('✅ WebSocket already connected, refreshing subscriptions');
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

