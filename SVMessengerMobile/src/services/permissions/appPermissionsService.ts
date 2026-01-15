/**
 * App Permissions Service
 * Централизирано управление на всички permissions за приложението
 * Показва всички permissions наведнъж при първо стартиране
 */

import { Platform, Alert, Linking } from 'react-native';
import { check, request, PERMISSIONS, RESULTS, Permission } from 'react-native-permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../../utils/logger';

const PERMISSIONS_STORAGE_KEY = '@svmessenger:permissions_requested';

export interface PermissionStatus {
  granted: boolean;
  blocked: boolean;
  unavailable: boolean;
}

export interface AppPermissionsStatus {
  notifications: PermissionStatus;
  microphone: PermissionStatus;
  camera: PermissionStatus;
  storage: PermissionStatus; // New storage/media permission
  fullScreenIntent: PermissionStatus; // Special permission - can't be requested runtime
}

class AppPermissionsService {
  /**
   * Check if permissions have been requested before
   */
  async hasRequestedPermissionsBefore(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(PERMISSIONS_STORAGE_KEY);
      return value === 'true';
    } catch (error) {
      logger.error('Error checking permissions request status:', error);
      return false;
    }
  }

  /**
   * Mark permissions as requested
   * CRITICAL: Must be called when user interacts with permissions screen (either grants or skips)
   * This prevents the permissions screen from showing repeatedly
   */
  async markPermissionsRequested(): Promise<void> {
    try {
      await AsyncStorage.setItem(PERMISSIONS_STORAGE_KEY, 'true');
    } catch (error) {
      logger.error('Error marking permissions as requested:', error);
    }
  }

  /**
   * Check all permissions status
   */
  async checkAllPermissions(): Promise<AppPermissionsStatus> {
    const status: AppPermissionsStatus = {
      notifications: { granted: false, blocked: false, unavailable: false },
      microphone: { granted: false, blocked: false, unavailable: false },
      camera: { granted: false, blocked: false, unavailable: false },
      storage: { granted: false, blocked: false, unavailable: false },
      fullScreenIntent: { granted: false, blocked: false, unavailable: false },
    };

    if (Platform.OS !== 'android') {
      // iOS permissions handled differently
      return status;
    }

    try {
      // Check notifications (Android 13+)
      if (Platform.Version >= 33) {
        try {
          const { PermissionsAndroid } = require('react-native');
          const hasPermission = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          status.notifications.granted = hasPermission;
        } catch (error) {
          logger.error('Error checking notification permission:', error);
        }
      } else {
        // Android 12 and below - granted by default
        status.notifications.granted = true;
      }

      // Check microphone
      try {
        const micPermission: Permission = PERMISSIONS.ANDROID.RECORD_AUDIO;
        const micResult = await check(micPermission);
        status.microphone.granted = micResult === RESULTS.GRANTED;
        status.microphone.blocked = micResult === RESULTS.BLOCKED;
        status.microphone.unavailable = micResult === RESULTS.UNAVAILABLE;
      } catch (error) {
        logger.error('Error checking microphone permission:', error);
      }

      // Check camera
      try {
        const cameraPermission: Permission = PERMISSIONS.ANDROID.CAMERA;
        const cameraResult = await check(cameraPermission);
        status.camera.granted = cameraResult === RESULTS.GRANTED;
        status.camera.blocked = cameraResult === RESULTS.BLOCKED;
        status.camera.unavailable = cameraResult === RESULTS.UNAVAILABLE;
      } catch (error) {
        logger.error('Error checking camera permission:', error);
      }

      // Check storage/media
      try {
        let storagePermission: Permission;
        if (Platform.Version >= 33) {
          storagePermission = PERMISSIONS.ANDROID.READ_MEDIA_IMAGES;
        } else {
          storagePermission = PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
        }

        const storageResult = await check(storagePermission);
        status.storage.granted = storageResult === RESULTS.GRANTED;
        status.storage.blocked = storageResult === RESULTS.BLOCKED;
        status.storage.unavailable = storageResult === RESULTS.UNAVAILABLE;
      } catch (error) {
        logger.error('Error checking storage permission:', error);
      }

      // Full Screen Intent - special permission, can't be checked runtime
      // It's granted automatically if app has USE_FULL_SCREEN_INTENT in manifest
      // But user needs to enable it in Settings -> Special app access
      status.fullScreenIntent.granted = true; // Assume granted, will check in settings if needed
    } catch (error) {
      logger.error('Error checking permissions:', error);
    }

    return status;
  }

  /**
   * Request all permissions at once
   */
  async requestAllPermissions(): Promise<AppPermissionsStatus> {
    const status: AppPermissionsStatus = {
      notifications: { granted: false, blocked: false, unavailable: false },
      microphone: { granted: false, blocked: false, unavailable: false },
      camera: { granted: false, blocked: false, unavailable: false },
      storage: { granted: false, blocked: false, unavailable: false },
      fullScreenIntent: { granted: false, blocked: false, unavailable: false },
    };

    if (Platform.OS !== 'android') {
      // iOS permissions handled differently
      return status;
    }

    try {
      // Request notifications (Android 13+)
      if (Platform.Version >= 33) {
        try {
          const { PermissionsAndroid } = require('react-native');
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: 'Разрешение за нотификации',
              message: 'SVMessenger се нуждае от разрешение за показване на нотификации и входящи обаждания',
              buttonNeutral: 'По-късно',
              buttonNegative: 'Отказ',
              buttonPositive: 'Разреши',
            }
          );
          status.notifications.granted = granted === PermissionsAndroid.RESULTS.GRANTED;
          status.notifications.blocked = granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN;
        } catch (error) {
          logger.error('Error requesting notification permission:', error);
        }
      } else {
        // Android 12 and below - granted by default
        status.notifications.granted = true;
      }

      // Request microphone
      try {
        const micPermission: Permission = PERMISSIONS.ANDROID.RECORD_AUDIO;
        const micResult = await request(micPermission);
        status.microphone.granted = micResult === RESULTS.GRANTED;
        status.microphone.blocked = micResult === RESULTS.BLOCKED;
        status.microphone.unavailable = micResult === RESULTS.UNAVAILABLE;
      } catch (error) {
        logger.error('Error requesting microphone permission:', error);
      }

      // Request camera
      try {
        const cameraPermission: Permission = PERMISSIONS.ANDROID.CAMERA;
        const cameraResult = await request(cameraPermission);
        status.camera.granted = cameraResult === RESULTS.GRANTED;
        status.camera.blocked = cameraResult === RESULTS.BLOCKED;
        status.camera.unavailable = cameraResult === RESULTS.UNAVAILABLE;
      } catch (error) {
        logger.error('Error requesting camera permission:', error);
      }

      // Request storage/media
      try {
        let storagePermission: Permission;
        let permissionName = 'Storage';

        if (Platform.Version >= 33) {
          // Android 13+ separate permissions, we request Images as primary
          storagePermission = PERMISSIONS.ANDROID.READ_MEDIA_IMAGES;
          permissionName = 'Photos/Videos';

          // Note: In a real app we might need to request VIDEO and AUDIO separately or together
          // But usually requesting one prompts the user for the group or we request them sequentially
          // Here we focus on Images as representative for "Media" access
        } else {
          storagePermission = PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
        }

        const storageResult = await request(storagePermission);
        status.storage.granted = storageResult === RESULTS.GRANTED;
        status.storage.blocked = storageResult === RESULTS.BLOCKED;
        status.storage.unavailable = storageResult === RESULTS.UNAVAILABLE;

        // If Android 13+, also request VIDEO specifically if needed, but let's keep it simple for now
        // Assuming granting Images access usually covers the main need for gallery
      } catch (error) {
        logger.error('Error requesting storage permission:', error);
      }

      // Full Screen Intent - can't be requested runtime
      // User needs to enable it manually in Settings -> Special app access -> Display over other apps
      status.fullScreenIntent.granted = true; // Assume granted, will check in settings if needed

      // Mark permissions as requested
      await this.markPermissionsRequested();
    } catch (error) {
      logger.error('Error requesting permissions:', error);
    }

    return status;
  }

  /**
   * Check if all critical permissions are granted
   */
  async areAllCriticalPermissionsGranted(): Promise<boolean> {
    const status = await this.checkAllPermissions();

    // Critical permissions: notifications, microphone (calls), storage (media/files)
    const notificationsOk = status.notifications.granted || Platform.Version < 33;
    const microphoneOk = status.microphone.granted;
    const storageOk = status.storage.granted;

    return notificationsOk && microphoneOk && storageOk;
  }

  /**
   * Show alert for blocked permissions with option to open settings
   */
  showBlockedPermissionsAlert(blockedPermissions: string[]): void {
    if (blockedPermissions.length === 0) {
      return;
    }

    const permissionsList = blockedPermissions.join(', ');
    Alert.alert(
      'Разрешения са блокирани',
      `Следните разрешения са блокирани: ${permissionsList}\n\nМоля, отидете в Настройки → Приложения → SVMessenger → Разрешения и ги разрешете за да работи приложението правилно.`,
      [
        {
          text: 'Отказ',
          style: 'cancel',
        },
        {
          text: 'Настройки',
          onPress: () => {
            Linking.openSettings();
          },
        },
      ],
      { cancelable: true }
    );
  }

  /**
   * Show info about Full Screen Intent permission
   */
  showFullScreenIntentInfo(): void {
    Alert.alert(
      'Разрешение за показване на екрана',
      'За да се показва екранът за входящи обаждания когато приложението е затворено, моля разрешете "Показване над други приложения" в настройките.\n\nНастройки → Приложения → SVMessenger → Специални разрешения → Показване над други приложения',
      [
        {
          text: 'Отказ',
          style: 'cancel',
        },
        {
          text: 'Настройки',
          onPress: () => {
            Linking.openSettings();
          },
        },
      ],
      { cancelable: true }
    );
  }
}

export const appPermissionsService = new AppPermissionsService();
