/**
 * Push Notification Service
 * Управление на push notifications чрез Firebase Cloud Messaging
 */

import { Platform, NativeModules } from 'react-native';
import apiClient from '../api/client';
import { API_CONFIG } from '../../config/api';
import { logger } from '../../utils/logger';

// Safe Firebase messaging import
let messaging: any = null;
try {
  messaging = require('@react-native-firebase/messaging').default;
} catch (error) {
  // Firebase messaging not available - silently continue
}

// Notification module for showing foreground notifications
const NotificationModule = NativeModules.NotificationModule as {
  showNotification: (title: string, body: string, data: any) => Promise<number>;
} | undefined;

// Type for remote message - matches Firebase RemoteMessage structure
interface RemoteMessage {
  notification?: {
    title?: string;
    body?: string;
    android?: any;
    ios?: any;
  };
  data?: { [key: string]: string };
  messageId?: string;
  [key: string]: any;
}

const getMessaging = () => {
  if (!messaging) {
    return null;
  }
  try {
    return messaging();
  } catch (error) {
    logger.error('Error getting Firebase messaging instance:', error);
    return null;
  }
};

export interface DeviceTokenRequest {
  deviceToken: string;
  platform: 'android' | 'ios';
  deviceId?: string;
  appVersion?: string;
}

class PushNotificationService {
  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (!messaging) {
        return false;
      }
      
      const messagingInstance = getMessaging();
      if (!messagingInstance) {
        return false;
      }
      
      if (Platform.OS === 'ios') {
        const authStatus = await messagingInstance.requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        return enabled;
      } else {
        // Android 13+ requires explicit POST_NOTIFICATIONS permission
        if (Platform.Version >= 33) {
          try {
            const { PermissionsAndroid } = require('react-native');
            const granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
              {
                title: 'Разрешение за нотификации',
                message: 'SVMessenger се нуждае от разрешение за показване на нотификации',
                buttonNeutral: 'По-късно',
                buttonNegative: 'Отказ',
                buttonPositive: 'OK',
              }
            );
            const hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
            return hasPermission;
          } catch (error) {
            logger.error('Error requesting Android notification permission:', error);
            // Fallback: assume permission is granted for older Android versions
            return true;
          }
        } else {
          // Android 12 and below - permissions are granted by default
          return true;
        }
      }
    } catch (error) {
      logger.error('Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Get FCM token
   */
  async getFCMToken(): Promise<string | null> {
    try {
      if (!messaging) {
        return null;
      }
      
      const messagingInstance = getMessaging();
      if (!messagingInstance) {
        return null;
      }
      
      const token = await messagingInstance.getToken();
      return token;
    } catch (error) {
      logger.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Register device token for push notifications
   */
  async registerDeviceToken(request: DeviceTokenRequest): Promise<void> {
    try {
      await apiClient.post(API_CONFIG.ENDPOINTS.DEVICE.REGISTER, request);
    } catch (error: any) {
      const status = error?.response?.status;
      const statusText = error?.response?.statusText;
      const message = error?.message;
      
      // Логване на подробна информация за грешката
      logger.error('Error registering device token:', {
        status,
        statusText,
        message,
        endpoint: API_CONFIG.ENDPOINTS.DEVICE.REGISTER,
        hasResponse: !!error?.response,
        responseData: error?.response?.data,
      });
      
      // Ако е 401 или 405 (вероятно изтекъл token), хвърли грешка за retry логиката
      if (status === 401 || status === 405) {
        throw error; // Хвърли за retry логиката в hook-а
      }
      
      // За други грешки, не хвърляй - това е non-critical операция
    }
  }

  /**
   * Unregister device token
   * Best effort - не хвърля грешки които чупят приложението
   */
  async unregisterDeviceToken(deviceToken: string): Promise<void> {
    try {
      // Backend очаква DELETE метод с body
      // Axios delete приема config като втори параметър, data се задава в config.data
      await apiClient.delete(API_CONFIG.ENDPOINTS.DEVICE.UNREGISTER, {
        data: { deviceToken },
      });
    } catch (error: any) {
      // Не хвърляй грешка - това е "best effort" операция
      // Токенът може да липсва, да е вече изтрит, user да не е логнат, backend да е спрян
      logger.error('Error unregistering device token (non-critical):', error?.response?.status || error?.message);
      // Не хвърляй error - просто лог
    }
  }

  /**
   * Setup notification handlers
   * CRITICAL FIX: НЕ показваме notifications във foreground (когато app-ът е отворен)
   * Notifications се показват само когато app-ът е в background или затворен
   * Това предотвратява излишни notifications докато потребителят вече използва app-а
   */
  setupNotificationHandlers(
    onNotificationReceived?: (notification: any) => void,
    onNotificationOpened?: (notification: any) => void
  ): void {
    if (!messaging) {
      return;
    }
    
    try {
      const messagingInstance = getMessaging();
      if (!messagingInstance) {
        return;
      }
      
      // Handle foreground notifications
      messagingInstance.onMessage(async (remoteMessage: RemoteMessage | null) => {
        // CRITICAL FIX: НЕ показваме notification във foreground
        // Firebase не показва notifications автоматично във foreground, но ние също не ги показваме
        // Notifications се показват само когато app-ът е в background или затворен
        // Това предотвратява излишни notifications докато потребителят вече използва app-а
        
        // Въпреки че не показваме notification, все пак извикваме callback-а
        // за да може app-ът да обработи данните (например за обаждания)
        if (onNotificationReceived) {
          onNotificationReceived(remoteMessage);
        }
      });

      // Handle background notifications (when app is in background)
      messagingInstance.onNotificationOpenedApp((remoteMessage: RemoteMessage | null) => {
        if (onNotificationOpened) {
          onNotificationOpened(remoteMessage);
        }
      });

      // Handle notification that opened app from quit state
      messagingInstance
        .getInitialNotification()
        .then((remoteMessage: RemoteMessage | null) => {
          if (remoteMessage) {
            if (onNotificationOpened) {
              onNotificationOpened(remoteMessage);
            }
          }
        })
        .catch((error: unknown) => {
          logger.error('Error getting initial notification:', error);
        });

      // Handle token refresh
      messagingInstance.onTokenRefresh((token: string) => {
        // Re-register token with backend
        const appVersion = require('../../../package.json').version || '0.0.1';
        this.registerDeviceToken({
          deviceToken: token,
          platform: Platform.OS === 'ios' ? 'ios' : 'android',
          appVersion,
        }).catch((error) => {
          logger.error('Error re-registering token:', error);
        });
      });
    } catch (error) {
      logger.error('Error setting up notification handlers:', error);
    }
  }

  /**
   * Delete FCM token (logout)
   */
  async deleteToken(): Promise<void> {
    try {
      if (!messaging) {
        return;
      }
      
      const messagingInstance = getMessaging();
      if (!messagingInstance) {
        return;
      }
      
      await messagingInstance.deleteToken();
    } catch (error) {
      logger.error('Error deleting FCM token:', error);
    }
  }
}

export const pushNotificationService = new PushNotificationService();

