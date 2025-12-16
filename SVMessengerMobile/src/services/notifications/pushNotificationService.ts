/**
 * Push Notification Service
 * Управление на push notifications чрез Firebase Cloud Messaging
 */

import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import apiClient from '../api/client';
import { API_CONFIG } from '../../config/api';

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
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        return enabled;
      } else {
        // Android permissions are granted by default
        return true;
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
      const token = await messaging().getToken();
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
      await apiClient.post(API_CONFIG.ENDPOINTS.DEVICE.REGISTER, request);
      console.log('Device token registered successfully');
    } catch (error: any) {
      console.error('Error registering device token:', error?.response?.status, error?.message);
      // Не хвърляй грешка - това е non-critical операция
      // Приложението трябва да работи дори без push notifications
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
   * Оптимизация: Foreground notifications се обработват в hook-а, който проверява дали WebSocket е активен
   * Ако WebSocket е активен, не се показва системно notification (данните идват през WebSocket)
   */
  setupNotificationHandlers(
    onNotificationReceived?: (notification: any) => void,
    onNotificationOpened?: (notification: any) => void
  ): void {
    // Handle foreground notifications
    // Оптимизация: Hook-ът ще реши дали да покаже notification според WebSocket статуса
    messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground notification received:', remoteMessage);
      if (onNotificationReceived) {
        onNotificationReceived(remoteMessage);
      }
    });

    // Handle background notifications (when app is in background)
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification opened app:', remoteMessage);
      if (onNotificationOpened) {
        onNotificationOpened(remoteMessage);
      }
    });

    // Handle notification that opened app from quit state
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('Notification opened app from quit state:', remoteMessage);
          if (onNotificationOpened) {
            onNotificationOpened(remoteMessage);
          }
        }
      });

    // Handle token refresh
    messaging().onTokenRefresh((token) => {
      console.log('FCM token refreshed:', token);
      // Re-register token with backend
      this.registerDeviceToken({
        deviceToken: token,
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
      }).catch((error) => {
        console.error('Error re-registering token:', error);
      });
    });
  }

  /**
   * Delete FCM token (logout)
   */
  async deleteToken(): Promise<void> {
    try {
      await messaging().deleteToken();
      console.log('FCM token deleted');
    } catch (error) {
      console.error('Error deleting FCM token:', error);
    }
  }
}

export const pushNotificationService = new PushNotificationService();

