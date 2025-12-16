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
import { stompClient } from '../services/websocket/stompClient';
import { debounce } from '../utils/constants';

export const usePushNotifications = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { fetchConversations } = useConversationsStore();
  const { fetchMessages } = useMessagesStore();
  
  // Оптимизация: Debounced refresh за conversations (избягва излишни API calls)
  const debouncedRefreshConversations = useRef(
    debounce(() => {
      fetchConversations();
    }, 500) // 500ms debounce
  ).current;

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
      
      // ✅ Обработка на INCOMING_CALL notifications
      if (notificationType === 'INCOMING_CALL' && conversationId) {
        console.log('📞 Incoming call notification received for conversation:', conversationId);
        // Call handling се прави чрез WebSocket, но notification-ът гарантира че потребителят е уведомен
        // WebSocket signal-ът ще отвори IncomingCallScreen автоматично
        // Тук само refresh-ваме conversations за да се вижда актуализираната информация
        debouncedRefreshConversations();
      }
      // ✅ Обработка на NEW_MESSAGE notifications
      else if (notificationType === 'NEW_MESSAGE' && conversationId) {
        // ✅ ВИНАГИ fetch-ваме съобщенията за конкретния conversation
        // Това гарантира че съобщенията се виждат дори ако WebSocket не работи правилно
        console.log('📥 Fetching messages for conversation:', conversationId);
        fetchMessages(conversationId);
        
        // Refresh conversations list
        debouncedRefreshConversations();
      } else if (conversationId) {
        // Fallback: ако има conversationId но няма type, все пак fetch-ваме messages
        console.log('📥 Fetching messages for conversation (fallback):', conversationId);
        fetchMessages(conversationId);
        debouncedRefreshConversations();
      } else {
        console.log('⚠️ Notification received but conversationId is missing or invalid:', conversationId);
      }

      // ВИНАГИ fetch-ваме съобщенията за да се виждат в реално време
      // Firebase автоматично показва notification дори когато app-ът е в foreground
    },
    [debouncedRefreshConversations, fetchMessages]
  );

  /**
   * Handle notification opened
   */
  const handleNotificationOpened = useCallback(
    (notification: any) => {
      console.log('📬 Notification opened:', notification);
      const data = notification.data;

      // Navigate based on notification type
      if (data?.conversationId) {
        const conversationId = Number(data.conversationId);
        const notificationType = data?.type;
        
        if (notificationType === 'INCOMING_CALL') {
          console.log('📞 Incoming call notification opened for conversation:', conversationId);
          // Call handling се прави чрез WebSocket
          // Тук само refresh-ваме conversations
          fetchConversations();
        } else {
          // NEW_MESSAGE или друг тип - fetch-ваме messages
          console.log('📥 Fetching messages for conversation:', conversationId);
          fetchConversations();
          fetchMessages(conversationId);
        }
      }
    },
    [fetchConversations, fetchMessages]
  );

  /**
   * Register device token when user logs in
   * Retry logic за да се справи с изтекъл token
   */
  const registerDeviceToken = useCallback(
    async (deviceToken: string, retryCount = 0) => {
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
          return registerDeviceToken(deviceToken, retryCount + 1);
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
    pushNotificationService.setupNotificationHandlers(
      handleNotificationReceived,
      handleNotificationOpened
    );
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
        const hasPermission = await requestPermissions();
        if (hasPermission) {
          const token = await getFCMToken();
          if (token) {
            await registerDeviceToken(token);
          }
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

  // Handle app state changes
  // Оптимизация: Refresh conversations само когато app става active (не при всяка промяна)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && isAuthenticated) {
        // Refresh conversations when app becomes active (с debounce)
        debouncedRefreshConversations();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, debouncedRefreshConversations]);

  return {
    registerDeviceToken,
    unregisterDeviceToken,
    requestPermissions,
    getFCMToken,
  };
};

