/**
 * Native Permissions Service
 * Bridge към native Android модул за проверка на special permissions
 */

import { NativeModules, Platform } from 'react-native';
import { logger } from '../../utils/logger';

// Lazy get PermissionsModule - may be undefined if native module is not ready
const getPermissionsModule = () => {
  try {
    return NativeModules?.PermissionsModule;
  } catch (error) {
    return undefined;
  }
};

interface FullScreenIntentStatus {
  granted: boolean;
  canRequest: boolean;
}

interface BatteryOptimizationStatus {
  isIgnoring: boolean;
  canRequest: boolean;
}

class NativePermissionsService {
  /**
   * Check Full Screen Intent permission status
   */
  async checkFullScreenIntentPermission(): Promise<FullScreenIntentStatus> {
    const PermissionsModule = getPermissionsModule();
    if (Platform.OS !== 'android' || !PermissionsModule) {
      return { granted: true, canRequest: false };
    }

    try {
      const result = await PermissionsModule.checkFullScreenIntentPermission();
      return result;
    } catch (error) {
      logger.error('Error checking Full Screen Intent permission:', error);
      return { granted: false, canRequest: false };
    }
  }

  /**
   * Open Full Screen Intent settings
   */
  async openFullScreenIntentSettings(): Promise<boolean> {
    const PermissionsModule = getPermissionsModule();
    if (Platform.OS !== 'android' || !PermissionsModule) {
      return false;
    }

    try {
      return await PermissionsModule.openFullScreenIntentSettings();
    } catch (error) {
      logger.error('Error opening Full Screen Intent settings:', error);
      return false;
    }
  }

  /**
   * Check battery optimization status
   */
  async checkBatteryOptimization(): Promise<BatteryOptimizationStatus> {
    const PermissionsModule = getPermissionsModule();
    if (Platform.OS !== 'android' || !PermissionsModule) {
      return { isIgnoring: true, canRequest: false };
    }

    try {
      const result = await PermissionsModule.checkBatteryOptimization();
      return result;
    } catch (error) {
      logger.error('Error checking battery optimization:', error);
      return { isIgnoring: false, canRequest: false };
    }
  }

  /**
   * Open battery optimization settings
   */
  async openBatteryOptimizationSettings(): Promise<boolean> {
    const PermissionsModule = getPermissionsModule();
    if (Platform.OS !== 'android' || !PermissionsModule) {
      return false;
    }

    try {
      return await PermissionsModule.openBatteryOptimizationSettings();
    } catch (error) {
      logger.error('Error opening battery optimization settings:', error);
      return false;
    }
  }

  /**
   * Request to ignore battery optimization
   */
  async requestIgnoreBatteryOptimization(): Promise<boolean> {
    const PermissionsModule = getPermissionsModule();
    if (Platform.OS !== 'android' || !PermissionsModule) {
      return true;
    }

    try {
      return await PermissionsModule.requestIgnoreBatteryOptimization();
    } catch (error) {
      logger.error('Error requesting battery optimization:', error);
      return false;
    }
  }
}

export const nativePermissionsService = new NativePermissionsService();
