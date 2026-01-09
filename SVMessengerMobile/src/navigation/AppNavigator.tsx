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
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Setup push notifications - wrapped in error boundary by hook itself
  usePushNotifications();

  // Lazy load call screens when needed (only when call is active)
  useEffect(() => {
    const showCallScreen = callState !== CallState.IDLE && callState !== CallState.DISCONNECTED;
    if (showCallScreen && !callScreensLoaded) {
      try {
        const callScreenModule = require('../screens/calls/CallScreen');
        const incomingCallScreenModule = require('../screens/calls/IncomingCallScreen');
        setCallScreenComponent(() => callScreenModule.CallScreen);
        setIncomingCallScreenComponent(() => incomingCallScreenModule.IncomingCallScreen);
        setCallScreensLoaded(true);
      } catch (error) {
        console.error('Failed to load call screens:', error);
      }
    }
  }, [callState, callScreensLoaded]);

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

  // Debug logging - log ALL state changes
  React.useEffect(() => {
    console.log('📞 [AppNavigator] State update:', {
      callState,
      hasCurrentCall: !!currentCall,
      currentCall: currentCall ? {
        id: currentCall.id,
        conversationId: currentCall.conversationId,
        participantId: currentCall.participantId,
        participantName: currentCall.participantName,
        state: currentCall.state,
      } : null,
      showCallScreen,
      shouldShowIncoming: callState === CallState.INCOMING,
      shouldShowCall: callState !== CallState.IDLE && callState !== CallState.DISCONNECTED,
    });
  }, [callState, currentCall, showCallScreen]);

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
          onReady={() => {
            console.log('✅ NavigationContainer ready');
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
                ) : (
                  <CallScreenComponent />
                )}
              </View>
            )}
          </View>
        </NavigationContainer>
      ) : (
        // Loading spinner - показва се ако след 3 секунди все още се зарежда
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.green[500]} />
        </View>
      )}
      
      {/* Splash Screen Overlay - показва се точно 3 секунди */}
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

