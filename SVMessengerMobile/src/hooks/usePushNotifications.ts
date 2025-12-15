/**
 * usePushNotifications Hook
 * Hook за управление на push notifications
 */

import { useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { pushNotificationService } from '../services/notifications/pushNotificationService';
import { Platform, AppState } from 'react-native';
import { useConversationsStore } from '../store/conversationsStore';
import { useMessagesStore } from '../store/messagesStore';

export const usePushNotifications = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { fetchConversations } = useConversationsStore();
  const { fetchMessages } = useMessagesStore();

  /**
   * Handle notification received
   */
  const handleNotificationReceived = useCallback(
    (notification: any) => {
      console.log('Notification received:', notification);
      const data = notification.data;

      // Refresh conversations if notification is about a new message
      if (data?.type === 'NEW_MESSAGE' || data?.conversationId) {
        fetchConversations();
      }
    },
    [fetchConversations]
  );

  /**
   * Handle notification opened
   */
  const handleNotificationOpened = useCallback(
    (notification: any) => {
      console.log('Notification opened:', notification);
      const data = notification.data;

      // Navigate to conversation if notification is about a message
      if (data?.conversationId) {
        // This will be handled by navigation logic
        // For now, just refresh conversations
        fetchConversations();
        if (data.conversationId) {
          fetchMessages(Number(data.conversationId));
        }
      }
    },
    [fetchConversations, fetchMessages]
  );

  /**
   * Register device token when user logs in
   */
  const registerDeviceToken = useCallback(
    async (deviceToken: string) => {
      if (!isAuthenticated || !user) return;

      try {
        await pushNotificationService.registerDeviceToken({
          deviceToken,
          platform: Platform.OS === 'ios' ? 'ios' : 'android',
          appVersion: '1.0.0', // TODO: Get from app config
        });
      } catch (error) {
        console.error('Failed to register device token:', error);
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

  // Request permissions and register token when authenticated
  useEffect(() => {
    if (isAuthenticated) {
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
    } else {
      // Unregister token when user logs out
      getFCMToken().then((token) => {
        if (token) {
          unregisterDeviceToken(token);
        }
      });
    }
  }, [
    isAuthenticated,
    requestPermissions,
    getFCMToken,
    registerDeviceToken,
    unregisterDeviceToken,
  ]);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && isAuthenticated) {
        // Refresh conversations when app becomes active
        fetchConversations();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, fetchConversations]);

  return {
    registerDeviceToken,
    unregisterDeviceToken,
    requestPermissions,
    getFCMToken,
  };
};

