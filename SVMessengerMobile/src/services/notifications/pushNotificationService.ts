/**
 * Push Notification Service
 * Управление на push notifications чрез Firebase Cloud Messaging
 */

import { Platform, NativeModules } from 'react-native';
import apiClient from '../api/client';
import { API_CONFIG } from '../../config/api';

// Safe Firebase messaging import
let messaging: any = null;
try {
  messaging = require('@react-native-firebase/messaging').default;
} catch (error) {
  console.warn('Firebase messaging not available:', error);
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
    console.warn('Firebase messaging is not initialized');
    return null;
  }
  try {
    return messaging();
  } catch (error) {
    console.warn('Error getting Firebase messaging instance:', error);
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
        console.warn('Firebase messaging not available');
        return false;
      }
      
      const messagingInstance = getMessaging();
      if (!messagingInstance) {
        console.warn('Firebase messaging instance not available');
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
            console.log('Android notification permission:', hasPermission ? 'granted' : 'denied');
            return hasPermission;
          } catch (error) {
            console.error('Error requesting Android notification permission:', error);
            // Fallback: assume permission is granted for older Android versions
            return true;
          }
        } else {
          // Android 12 and below - permissions are granted by default
          return true;
        }
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Get FCM token
   */
  async getFCMToken(): Promise<string | null> {
    try {
      if (!messaging) {
        console.warn('Firebase messaging not available');
        return null;
      }
      
      const messagingInstance = getMessaging();
      if (!messagingInstance) {
        console.warn('Firebase messaging instance not available');
        return null;
      }
      
      const token = await messagingInstance.getToken();
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Register device token for push notifications
   */
  async registerDeviceToken(request: DeviceTokenRequest): Promise<void> {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.DEVICE.REGISTER, request);
      console.log('Device token registered successfully:', response.data);
    } catch (error: any) {
      const status = error?.response?.status;
      const statusText = error?.response?.statusText;
      const message = error?.message;
      
      // Логване на подробна информация за грешката
      console.error('Error registering device token:', {
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
      console.warn('Device token registration failed (non-critical), continuing...');
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
      console.log('Device token unregistered successfully');
    } catch (error: any) {
      // Не хвърляй грешка - това е "best effort" операция
      // Токенът може да липсва, да е вече изтрит, user да не е логнат, backend да е спрян
      console.warn('Error unregistering device token (non-critical):', error?.response?.status || error?.message);
      // Не хвърляй error - просто лог
    }
  }

  /**
   * Setup notification handlers
   * ВИНАГИ показваме notification дори когато app-ът е в foreground
   * Това гарантира че потребителят винаги получава notification за нови съобщения
   */
  setupNotificationHandlers(
    onNotificationReceived?: (notification: any) => void,
    onNotificationOpened?: (notification: any) => void
  ): void {
    if (!messaging) {
      console.warn('Firebase messaging not available, skipping notification handlers setup');
      return;
    }
    
    try {
      const messagingInstance = getMessaging();
      if (!messagingInstance) {
        console.warn('Firebase messaging instance not available, skipping notification handlers setup');
        return;
      }
      
      // Handle foreground notifications
      messagingInstance.onMessage(async (remoteMessage: RemoteMessage | null) => {
        console.log('📬 Firebase foreground notification received:', {
          notification: remoteMessage?.notification,
          data: remoteMessage?.data,
          messageId: remoteMessage?.messageId,
        });
        
        // Show notification when app is in foreground
        // Firebase doesn't show notifications automatically in foreground
        if (remoteMessage?.notification || remoteMessage?.data) {
          const title = remoteMessage?.notification?.title || remoteMessage?.data?.title || 'SVMessenger';
          const body = remoteMessage?.notification?.body || remoteMessage?.data?.body || 'Ново съобщение';
          
          // Prepare data object for notification
          const data: { [key: string]: string } = {};
          if (remoteMessage?.data) {
            Object.keys(remoteMessage.data).forEach(key => {
              data[key] = String(remoteMessage.data[key]);
            });
          }
          
          // Show notification using native module (Android only)
          if (Platform.OS === 'android' && NotificationModule?.showNotification) {
            try {
              await NotificationModule.showNotification(title, body, data);
              console.log('✅ Foreground notification shown:', { title, body, data });
            } catch (error) {
              console.error('❌ Error showing foreground notification:', error);
            }
          } else {
            console.warn('⚠️ NotificationModule not available, cannot show foreground notification');
          }
        }
        
        if (onNotificationReceived) {
          onNotificationReceived(remoteMessage);
        }
      });

      // Handle background notifications (when app is in background)
      messagingInstance.onNotificationOpenedApp((remoteMessage: RemoteMessage | null) => {
        console.log('Notification opened app:', remoteMessage);
        if (onNotificationOpened) {
          onNotificationOpened(remoteMessage);
        }
      });

      // Handle notification that opened app from quit state
      messagingInstance
        .getInitialNotification()
        .then((remoteMessage: RemoteMessage | null) => {
          if (remoteMessage) {
            console.log('Notification opened app from quit state:', remoteMessage);
            if (onNotificationOpened) {
              onNotificationOpened(remoteMessage);
            }
          }
        })
        .catch((error: unknown) => {
          console.warn('Error getting initial notification:', error);
        });

      // Handle token refresh
      messagingInstance.onTokenRefresh((token: string) => {
        console.log('FCM token refreshed:', token);
        // Re-register token with backend
        const appVersion = require('../../../package.json').version || '0.0.1';
        this.registerDeviceToken({
          deviceToken: token,
          platform: Platform.OS === 'ios' ? 'ios' : 'android',
          appVersion,
        }).catch((error) => {
          console.error('Error re-registering token:', error);
        });
      });
    } catch (error) {
      console.error('Error setting up notification handlers:', error);
    }
  }

  /**
   * Delete FCM token (logout)
   */
  async deleteToken(): Promise<void> {
    try {
      if (!messaging) {
        console.warn('Firebase messaging not available');
        return;
      }
      
      const messagingInstance = getMessaging();
      if (!messagingInstance) {
        console.warn('Firebase messaging instance not available');
        return;
      }
      
      await messagingInstance.deleteToken();
      console.log('FCM token deleted');
    } catch (error) {
      console.error('Error deleting FCM token:', error);
    }
  }
}

export const pushNotificationService = new PushNotificationService();

