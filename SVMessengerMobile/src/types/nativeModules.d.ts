/**
 * Native Modules Type Definitions
 */

declare module 'react-native' {
  interface NativeModulesStatic {
    PermissionsModule: {
      checkFullScreenIntentPermission(): Promise<{
        granted: boolean;
        canRequest: boolean;
      }>;
      openFullScreenIntentSettings(): Promise<boolean>;
      checkBatteryOptimization(): Promise<{
        isIgnoring: boolean;
        canRequest: boolean;
      }>;
      openBatteryOptimizationSettings(): Promise<boolean>;
      requestIgnoreBatteryOptimization(): Promise<boolean>;
    };
  }
}
