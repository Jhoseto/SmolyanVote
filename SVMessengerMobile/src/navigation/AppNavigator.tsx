/**
 * App Navigator
 * Главен navigator - управлява Auth и Main flows
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet, Text, Platform } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { RootStackParamList } from '../types/navigation';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { useAuthStore } from '../store/authStore';
import { useCallsStore } from '../store/callsStore';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { CallState } from '../types/call';
import { Colors } from '../theme';
import { SplashScreen } from '../components/SplashScreen';
import { navigationRef } from './navigationRef';
import { logger } from '../utils/logger';
import { appPermissionsService } from '../services/permissions/appPermissionsService';

// Safe import with fallback - use default export
let PermissionsRequestScreen: React.ComponentType<any> | null = null;
try {
  const PermissionsModule = require('../components/permissions/PermissionsRequestScreen');
  PermissionsRequestScreen = PermissionsModule.default || PermissionsModule.PermissionsRequestScreen || null;
} catch (error) {
  logger.error('Failed to load PermissionsRequestScreen:', error);
}

// Enable native screens for better performance
// This must be called before any screen components are rendered
if (Platform.OS === 'android' || Platform.OS === 'ios') {
  enableScreens(true);
}

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, refreshAuth } = useAuthStore();
  const { callState, currentCall } = useCallsStore();
  const [isInitializing, setIsInitializing] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [callScreensLoaded, setCallScreensLoaded] = useState(false);
  const [CallScreenComponent, setCallScreenComponent] = useState<React.ComponentType<any> | null>(null);
  const [IncomingCallScreenComponent, setIncomingCallScreenComponent] = useState<React.ComponentType<any> | null>(null);
  const [OutgoingCallScreenComponent, setOutgoingCallScreenComponent] = useState<React.ComponentType<any> | null>(null);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPermissionsScreen, setShowPermissionsScreen] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(true);

  // Setup push notifications - wrapped in error boundary by hook itself
  usePushNotifications();

  // Lazy load call screens when needed (only when call is active)
  // CRITICAL FIX: Load each module separately with individual error handling
  // This ensures critical components (CallScreen, IncomingCallScreen) are loaded even if optional component (OutgoingCallScreen) fails
  useEffect(() => {
    const showCallScreen = callState !== CallState.IDLE && callState !== CallState.DISCONNECTED;
    if (showCallScreen && !callScreensLoaded) {
      // Load CallScreen (critical - required for all call states)
      try {
        const callScreenModule = require('../screens/calls/CallScreen');
        setCallScreenComponent(() => callScreenModule.CallScreen);
      } catch (error) {
        console.error('❌ Failed to load CallScreen:', error);
        // Don't set callScreensLoaded if critical component fails
        return;
      }

      // Load IncomingCallScreen (critical - required for incoming calls)
      try {
        const incomingCallScreenModule = require('../screens/calls/IncomingCallScreen');
        setIncomingCallScreenComponent(() => incomingCallScreenModule.IncomingCallScreen);
      } catch (error) {
        console.error('❌ Failed to load IncomingCallScreen:', error);
        // Don't set callScreensLoaded if critical component fails
        return;
      }

      // Load OutgoingCallScreen (optional - fallback to CallScreen if it fails)
      try {
        const outgoingCallScreenModule = require('../screens/calls/OutgoingCallScreen');
        setOutgoingCallScreenComponent(() => outgoingCallScreenModule.OutgoingCallScreen);
      } catch (error) {
        console.warn('⚠️ Failed to load OutgoingCallScreen (optional, will use CallScreen as fallback):', error);
        // OutgoingCallScreen is optional - don't prevent call overlay from rendering
        setOutgoingCallScreenComponent(null);
      }

      // Mark as loaded only if critical components succeeded
      setCallScreensLoaded(true);
    }
  }, [callState, callScreensLoaded]);

  // Check permissions on first launch
  useEffect(() => {
    const checkPermissions = async () => {
      if (Platform.OS !== 'android') {
        setCheckingPermissions(false);
        return;
      }

      try {
        // CRITICAL CHECK: Always check if permissions are granted on launch
        // User requested MANDATORY permissions check - app shouldn't work without them
        const allGranted = await appPermissionsService.areAllCriticalPermissionsGranted();

        if (!allGranted) {
          // If permissions are missing, show the screen regardless of previous requests
          // This ensures the user MUST grant permissions to use the app
          setShowPermissionsScreen(true);
        } else {
          // All granted, proceed
          setCheckingPermissions(false);
        }

        // We still mark as requested to track first launch, but the check above overrides it
        const hasRequestedBefore = await appPermissionsService.hasRequestedPermissionsBefore();
        if (!hasRequestedBefore) {
          // Determine if we need to mark it (will be marked when user completes screen)
        }

        // If we didn't show the screen, stop checking
        if (allGranted) {
          setCheckingPermissions(false);
        }
      } catch (error) {
        logger.error('Error checking permissions status:', error);
        setCheckingPermissions(false);
      }
    };

    checkPermissions();
  }, []);

  // Инициализация на auth при стартиране
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setHasError(false);
        setErrorMessage(null);
        await refreshAuth();
      } catch (error: any) {
        console.error('Error refreshing auth:', error);
        setHasError(true);
        setErrorMessage(error?.message || 'Грешка при инициализация');
      } finally {
        setIsInitializing(false);
      }
    };

    // Стартираме инициализацията веднага
    const timer = setTimeout(() => {
      initializeAuth();
    }, 100);

    return () => clearTimeout(timer);
  }, [refreshAuth]);

  // Show call screens if call is active
  const showCallScreen =
    callState !== CallState.IDLE && callState !== CallState.DISCONNECTED;

  // State tracking for call screen visibility
  React.useEffect(() => {
    // Call screen visibility is managed by showCallScreen variable
  }, [callState, currentCall, showCallScreen]);

  // Show permissions screen if needed (only on Android, first launch)
  if (Platform.OS === 'android' && showPermissionsScreen && !checkingPermissions) {
    if (!PermissionsRequestScreen) {
      // Fallback if component failed to load
      logger.error('PermissionsRequestScreen component not available');
      setShowPermissionsScreen(false);
      return null;
    }
    return (
      <View style={{ flex: 1 }}>
        <PermissionsRequestScreen
          onComplete={(allGranted) => {
            setShowPermissionsScreen(false);
            // Continue with normal app flow
          }}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Основно съдържание - зарежда се отзад, дори докато се показва splash */}
      {hasError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Грешка при стартиране</Text>
          <Text style={styles.errorDetails}>{errorMessage}</Text>
          <Text style={styles.errorDetails}>Моля, рестартирай приложението</Text>
        </View>
      ) : !isInitializing ? (
        <NavigationContainer
          ref={navigationRef}
          onReady={() => {
            // Navigation container ready
          }}
          onStateChange={() => {
            // Navigation state changed
          }}
        >
          <View style={{ flex: 1 }}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              {isAuthenticated ? (
                <Stack.Screen name="Main" component={MainNavigator} />
              ) : (
                <Stack.Screen name="Auth" component={AuthNavigator} />
              )}
            </Stack.Navigator>

            {/* Call Screens Overlay */}
            {/* CRITICAL FIX Bug 1: Only require CallScreenComponent and IncomingCallScreenComponent
                OutgoingCallScreenComponent is optional - if it fails to load, use CallScreenComponent as fallback
                This ensures call overlay always renders even if one component fails to load */}
            {showCallScreen && CallScreenComponent && IncomingCallScreenComponent && (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 9999,
                }}
              >
                {callState === CallState.INCOMING ? (
                  <IncomingCallScreenComponent />
                ) : ((callState === CallState.OUTGOING || callState === CallState.CONNECTING) && OutgoingCallScreenComponent) ? (
                  <OutgoingCallScreenComponent />
                ) : (
                  <CallScreenComponent />
                )}
              </View>
            )}
          </View>
        </NavigationContainer>
      ) : (
        // CRITICAL FIX: Don't show loading spinner if splash screen is visible
        // This prevents showing ugly loading screen before splash screen appears
        // Show loading spinner only if splash screen is not visible (shouldn't happen normally)
        !showSplash && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.green[500]} />
          </View>
        )
      )}

      {/* Splash Screen Overlay - показва се точно 3 секунди */}
      {/* CRITICAL FIX: Show splash screen during initialization to prevent ugly loading screen flash */}
      {/* Splash screen has higher zIndex and will cover any loading indicators */}
      {showSplash && (
        <SplashScreen
          onFinish={() => {
            setShowSplash(false);
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.background.primary,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: Colors.text.primary,
  },
  errorDetails: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 5,
  },
});

