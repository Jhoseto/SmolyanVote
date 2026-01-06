/**
 * usePushNotifications Hook
 * Hook за управление на push notifications
 */

import { useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { pushNotificationService } from '../services/notifications/pushNotificationService';
import { Platform, AppState } from 'react-native';
import { useConversationsStore } from '../store/conversationsStore';
import { useMessagesStore } from '../store/messagesStore';
import { useCallsStore } from '../store/callsStore';
import { CallState } from '../types/call';
import { svMobileWebSocketService } from '../services/websocket/stompClient';
import { debounce } from '../utils/constants';
import { soundService } from '../services/sounds/soundService';
import apiClient from '../services/api/client';
import { API_CONFIG } from '../config/api';

export const usePushNotifications = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { fetchConversations } = useConversationsStore();
  const { fetchMessages } = useMessagesStore();
  const { startCall, setCallState } = useCallsStore();
  
  // Оптимизация: Debounced refresh за conversations (избягва излишни API calls)
  const debouncedRefreshConversations = useRef(
    debounce(() => {
      fetchConversations();
    }, 500) // 500ms debounce
  ).current;

  // Оптимизация: Debounced fetch за messages (избягва излишни API calls)
  const debouncedFetchMessages = useRef(
    debounce((conversationId: number) => {
      fetchMessages(conversationId);
    }, 300) // 300ms debounce
  ).current;

  // Heartbeat (disabled – WebSocket се грижи за online статус; избягваме излишни 401)
  useEffect(() => {
    return () => {};
  }, [isAuthenticated]);

  /**
   * Handle notification received
   * ВИНАГИ fetch-ваме съобщенията за конкретния conversation когато се получи notification
   * Това гарантира че съобщенията се виждат дори ако WebSocket не работи правилно
   */
  const handleNotificationReceived = useCallback(
    (notification: any) => {
      console.log('📬 Notification received:', {
        notification: notification?.notification,
        data: notification?.data,
        messageId: notification?.messageId,
      });
      
      const data = notification.data || notification;

      const isAppInForeground = AppState.currentState === 'active';
      const conversationId = data?.conversationId ? Number(data.conversationId) : null;

      console.log('📬 Notification details:', {
        isAppInForeground,
        conversationId,
        type: data?.type,
        hasData: !!data,
      });

      const notificationType = data?.type;
      
      // ✅ Обработка на INCOMING_CALL notifications (foreground)
      if (notificationType === 'INCOMING_CALL' && conversationId) {
        console.log('📞 Incoming call notification received for conversation:', conversationId);

        // Опитай да намериш участника от store / API
        const { getConversation, conversations } = useConversationsStore.getState();
        const findParticipant = async () => {
          const existing = conversations.find((c) => c.id === conversationId);
          if (existing?.participant) return existing.participant;
          try {
            const conv = await getConversation(conversationId);
            return conv?.participant;
          } catch {
            return undefined;
          }
        };

        findParticipant().then((participant) => {
          const participantId = participant?.id ?? 0;
          const participantName = data.callerName || participant?.fullName || participant?.username || 'Неизвестен потребител';
          const participantImageUrl = participant?.imageUrl;

          // Стартирай входящ разговор локално (UI + звук)
          startCall(
            conversationId,
            participantId,
            participantName,
            participantImageUrl,
            CallState.INCOMING
          );
          setCallState(CallState.INCOMING);
          soundService.playIncomingCallSound();

          // Refresh за актуални данни
          debouncedRefreshConversations();
        });
      }
      // ✅ Обработка на NEW_MESSAGE notifications
      else if (notificationType === 'NEW_MESSAGE' && conversationId) {
        // ✅ ВИНАГИ fetch-ваме съобщенията за конкретния conversation (с debounce)
        // Това гарантира че съобщенията се виждат дори ако WebSocket не работи правилно
        console.log('📥 Fetching messages for conversation:', conversationId);
        debouncedFetchMessages(conversationId);
        
        // Update conversation from backend (за да вземем correct unread count)
        // Използваме debounce за да избегнем излишни заявки
        debouncedRefreshConversations();
      } else if (conversationId) {
        // Fallback: ако има conversationId но няма type, fetch-ваме latest data from backend
        console.log('📥 Fetching messages and data for conversation (fallback):', conversationId);
        debouncedFetchMessages(conversationId);
        debouncedRefreshConversations();
      } else {
        console.log('⚠️ Notification received but conversationId is missing or invalid:', conversationId);
      }

      // ВИНАГИ fetch-ваме съобщенията за да се виждат в реално време
      // Firebase автоматично показва notification дори когато app-ът е в foreground
    },
    [debouncedRefreshConversations, debouncedFetchMessages]
  );

  /**
   * Handle notification opened
   * Когато app-ът се отвори от notification (затворен или в background)
   */
  const handleNotificationOpened = useCallback(
    async (notification: any) => {
      console.log('📬 Notification opened:', notification);
      const data = notification.data || notification;

      // Navigate based on notification type
      if (data?.conversationId) {
        const conversationId = Number(data.conversationId);
        const notificationType = data?.type;
        
        if (notificationType === 'INCOMING_CALL') {
          console.log('📞 Incoming call notification opened for conversation:', conversationId);
          
          // Намери conversation за да вземем participant информация
          await fetchConversations();

          // Вземи актуализираните conversations / ако липсват – fetch по id
          const { conversations, getConversation } = useConversationsStore.getState();
          let participant = conversations.find((c) => c.id === conversationId)?.participant;
          if (!participant) {
            const conv = await getConversation(conversationId).catch(() => null);
            participant = conv?.participant;
          }
          
          const participantId = participant?.id ?? 0;
          const participantName = data.callerName || participant?.fullName || participant?.username || 'Неизвестен потребител';
          const participantImageUrl = participant?.imageUrl;

          // Стартирай incoming call от notification data (дори ако липсва participant, показваме име)
          startCall(
            conversationId,
            participantId,
            participantName,
            participantImageUrl,
            CallState.INCOMING
          );
          setCallState(CallState.INCOMING);
          soundService.playIncomingCallSound();

          // Свържи WebSocket ако не е свързан (за да получим call signals)
          if (!svMobileWebSocketService.isConnected() && isAuthenticated && user) {
            console.log('📞 Connecting WebSocket for incoming call...');
          }
        } else {
          // NEW_MESSAGE или друг тип - fetch-ваме messages (с debounce)
          console.log('📥 Fetching messages for conversation:', conversationId);
          debouncedFetchMessages(conversationId);
          debouncedRefreshConversations();
        }
      }
    },
    [debouncedRefreshConversations, debouncedFetchMessages, startCall, setCallState, isAuthenticated, user]
  );

  /**
   * Register device token when user logs in
   * Retry logic за да се справи с изтекъл token
   */
  const registerDeviceToken = useCallback(
    async (deviceToken: string, retryCount = 0): Promise<void> => {
      if (!isAuthenticated || !user) {
        console.log('Skipping device token registration - not authenticated');
        return;
      }

      try {
        // Изчакваме малко, за да се уверим че token е запазен след login
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Get app version from package.json
        const appVersion = require('../../package.json').version || '0.0.1';
        
        await pushNotificationService.registerDeviceToken({
          deviceToken,
          platform: Platform.OS === 'ios' ? 'ios' : 'android',
          appVersion,
        });
      } catch (error: any) {
        // Ако получим 401 или 405 (вероятно изтекъл token), опитай да refresh-неш token и retry
        if ((error?.response?.status === 401 || error?.response?.status === 405) && retryCount < 2) {
          console.log(`Device token registration failed (${error?.response?.status}), attempting token refresh and retry...`);
          
          // Изчакай малко преди retry
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Retry - interceptor-ът ще се опита да refresh-не token-а
          try {
            return await registerDeviceToken(deviceToken, retryCount + 1);
          } catch (retryError) {
            console.error('Retry failed for device token registration:', retryError);
            // Не хвърляй грешка - non-critical операция
            return;
          }
        }
        
        console.error('Failed to register device token:', error?.response?.status || error?.message);
        // Не хвърляй грешка - non-critical операция
      }
    },
    [isAuthenticated, user]
  );

  /**
   * Unregister device token when user logs out
   */
  const unregisterDeviceToken = useCallback(async (deviceToken: string) => {
    try {
      await pushNotificationService.unregisterDeviceToken(deviceToken);
      await pushNotificationService.deleteToken();
    } catch (error) {
      console.error('Failed to unregister device token:', error);
    }
  }, []);

  /**
   * Request notification permissions
   */
  const requestPermissions = useCallback(async () => {
    try {
      return await pushNotificationService.requestPermissions();
    } catch (error) {
      console.error('Failed to request permissions:', error);
      return false;
    }
  }, []);

  /**
   * Get FCM token
   */
  const getFCMToken = useCallback(async () => {
    try {
      return await pushNotificationService.getFCMToken();
    } catch (error) {
      console.error('Failed to get FCM token:', error);
      return null;
    }
  }, []);

  // Setup notification handlers on mount
  useEffect(() => {
    try {
      pushNotificationService.setupNotificationHandlers(
        handleNotificationReceived,
        handleNotificationOpened
      );
    } catch (error) {
      console.error('Error setting up notification handlers:', error);
      // Don't crash the app if notification setup fails
    }
  }, [handleNotificationReceived, handleNotificationOpened]);

  // Track previous authentication state to detect logout
  const prevIsAuthenticatedRef = useRef(isAuthenticated);

  // Request permissions and register token when authenticated
  // Unregister ONLY when user logs out (isAuthenticated changes from true to false)
  useEffect(() => {
    const wasAuthenticated = prevIsAuthenticatedRef.current;
    const isNowAuthenticated = isAuthenticated;

    if (isNowAuthenticated) {
      // User logged in - register token
      const setupNotifications = async () => {
        try {
          const hasPermission = await requestPermissions();
          if (hasPermission) {
            const token = await getFCMToken();
            if (token) {
              // Wrap in try-catch to prevent unhandled promise rejection
              await registerDeviceToken(token).catch((error) => {
                console.error('Unhandled error in registerDeviceToken:', error);
                // Error already logged in registerDeviceToken, just prevent unhandled rejection
              });
            }
          }
        } catch (error) {
          console.error('Error in setupNotifications:', error);
          // Don't throw - non-critical operation
        }
      };

      setupNotifications();
    } else if (wasAuthenticated && !isNowAuthenticated) {
      // User logged out (was authenticated, now not) - unregister token
      // Това се случва само при logout, не при всяко зареждане
      getFCMToken().then((token) => {
        if (token) {
          unregisterDeviceToken(token);
        }
      });
    }

    // Update ref for next render
    prevIsAuthenticatedRef.current = isAuthenticated;
  }, [
    isAuthenticated,
    requestPermissions,
    getFCMToken,
    registerDeviceToken,
    unregisterDeviceToken,
  ]);

  // Online status management
  // WebSocket connection е ОСНОВНИЯТ механизъм за online статус - backend автоматично обновява статуса при свързване
  // Heartbeat endpoint има проблеми с JWT authentication, затова разчитаме основно на WebSocket
  const ensureOnlineStatus = useCallback(async () => {
    if (!isAuthenticated) {
      console.log('💓 Skipping online status update - user not authenticated');
      return;
    }
    
    // WebSocket connection автоматично обновява online статуса когато се свърже
    // Проверяваме дали WebSocket е connected
    if (svMobileWebSocketService.isConnected()) {
      console.log('💓 WebSocket is connected - online status maintained automatically by backend');
      return;
    }
    
    // Ако WebSocket не е connected, опитваме се да се reconnect-нем
    // WebSocket reconnect ще обновява online статуса автоматично
    console.log('💓 WebSocket not connected - will reconnect automatically (online status will be updated on connect)');
    // WebSocket reconnect се случва автоматично от useWebSocket hook при app state change
  }, [isAuthenticated]);


  // Handle app state changes
  // Оптимизация: Refresh conversations само когато app става active (не при всяка промяна)
  // НЕ refresh-ваме ако има отворен чат, за да не презапишем локалните промени
  // Също така изпращаме heartbeat за да поддържаме online статус
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && isAuthenticated) {
        // Ensure online status when app becomes active
        // WebSocket connection автоматично обновява online статуса
        ensureOnlineStatus();
        
        const { selectedConversationId } = useConversationsStore.getState();
        // Refresh само ако няма отворен чат
        if (!selectedConversationId) {
        debouncedRefreshConversations();
        } else {
          console.log('⏭️ Skipping conversations refresh on app active - chat is open');
        }
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        console.log('⏸️ App went to background');
        // WebSocket остава активен в background за real-time нотификации
        // Backend автоматично маркира като offline след 2 минути неактивност
      }
    });

    // Ensure online status when component mounts and app is active
    if (isAuthenticated && AppState.currentState === 'active') {
      ensureOnlineStatus();
    }

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, debouncedRefreshConversations, ensureOnlineStatus]);

  return {
    registerDeviceToken,
    unregisterDeviceToken,
    requestPermissions,
    getFCMToken,
  };
};

