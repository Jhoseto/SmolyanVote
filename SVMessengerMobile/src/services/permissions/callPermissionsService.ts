/**
 * Call Permissions Service
 * Управлява runtime permissions за camera и microphone в Android
 */

import { Platform, Alert, Linking } from 'react-native';
import { check, request, PERMISSIONS, RESULTS, Permission } from 'react-native-permissions';

class CallPermissionsService {
  /**
   * Request microphone permission
   */
  async requestMicrophonePermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      // iOS permissions are handled differently
      return true;
    }

    try {
      const permission: Permission = PERMISSIONS.ANDROID.RECORD_AUDIO;
      const checkResult = await check(permission);

      if (checkResult === RESULTS.GRANTED) {
        console.log('✅ Microphone permission already granted');
        return true;
      }

      if (checkResult === RESULTS.BLOCKED) {
        console.warn('⚠️ Microphone permission is blocked');
        this.showPermissionAlert('Микрофон', 'За да използвате аудио разговори, моля разрешете достъп до микрофона в настройките на приложението.');
        return false;
      }

      // Request permission
      const requestResult = await request(permission);

      if (requestResult === RESULTS.GRANTED) {
        console.log('✅ Microphone permission granted');
        return true;
      } else {
        console.warn('⚠️ Microphone permission denied:', requestResult);
        this.showPermissionAlert('Микрофон', 'За да използвате аудио разговори, моля разрешете достъп до микрофона.');
        return false;
      }
    } catch (error) {
      console.error('❌ Error requesting microphone permission:', error);
      return false;
    }
  }

  /**
   * Request camera permission
   */
  async requestCameraPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      // iOS permissions are handled differently
      return true;
    }

    try {
      const permission: Permission = PERMISSIONS.ANDROID.CAMERA;
      const checkResult = await check(permission);

      if (checkResult === RESULTS.GRANTED) {
        console.log('✅ Camera permission already granted');
        return true;
      }

      if (checkResult === RESULTS.BLOCKED) {
        console.warn('⚠️ Camera permission is blocked');
        this.showPermissionAlert('Камера', 'За да използвате видео разговори, моля разрешете достъп до камерата в настройките на приложението.');
        return false;
      }

      // Request permission
      const requestResult = await request(permission);

      if (requestResult === RESULTS.GRANTED) {
        console.log('✅ Camera permission granted');
        return true;
      } else {
        console.warn('⚠️ Camera permission denied:', requestResult);
        this.showPermissionAlert('Камера', 'За да използвате видео разговори, моля разрешете достъп до камерата.');
        return false;
      }
    } catch (error) {
      console.error('❌ Error requesting camera permission:', error);
      return false;
    }
  }

  /**
   * Request both microphone and camera permissions
   */
  async requestCallPermissions(requireVideo: boolean = false): Promise<{ audio: boolean; video: boolean }> {
    const audio = await this.requestMicrophonePermission();
    let video = false;

    if (requireVideo) {
      video = await this.requestCameraPermission();
    }

    return { audio, video };
  }

  /**
   * Check if microphone permission is granted
   */
  async checkMicrophonePermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const permission: Permission = PERMISSIONS.ANDROID.RECORD_AUDIO;
      const result = await check(permission);
      return result === RESULTS.GRANTED;
    } catch (error) {
      console.error('❌ Error checking microphone permission:', error);
      return false;
    }
  }

  /**
   * Check if camera permission is granted
   */
  async checkCameraPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const permission: Permission = PERMISSIONS.ANDROID.CAMERA;
      const result = await check(permission);
      return result === RESULTS.GRANTED;
    } catch (error) {
      console.error('❌ Error checking camera permission:', error);
      return false;
    }
  }

  /**
   * Show permission alert with option to open settings
   */
  private showPermissionAlert(title: string, message: string): void {
    Alert.alert(
      title,
      message,
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

export const callPermissionsService = new CallPermissionsService();

