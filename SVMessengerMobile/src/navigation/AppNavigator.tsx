/**
 * App Navigator
 * Главен navigator - управлява Auth и Main flows
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { RootStackParamList } from '../types/navigation';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { CallScreen } from '../screens/calls/CallScreen';
import { IncomingCallScreen } from '../screens/calls/IncomingCallScreen';
import { useAuthStore } from '../store/authStore';
import { useCallsStore } from '../store/callsStore';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { CallState } from '../types/call';
import { Colors } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, refreshAuth } = useAuthStore();
  const { callState, currentCall } = useCallsStore();
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Setup push notifications
  usePushNotifications();

  useEffect(() => {
    // Проверяваме дали user е все още authenticated при стартиране
    const initializeAuth = async () => {
      try {
        await refreshAuth();
      } catch (error) {
        console.error('Error refreshing auth:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
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

  // Show loading screen while initializing auth
  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.green[500]} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <View style={{ flex: 1 }}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isAuthenticated ? (
            <Stack.Screen name="Main" component={MainNavigator} />
          ) : (
            <Stack.Screen name="Auth" component={AuthNavigator} />
          )}
        </Stack.Navigator>

        {/* Call Screens Overlay */}
        {showCallScreen && (
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
              <IncomingCallScreen />
            ) : (
              <CallScreen />
            )}
          </View>
        )}
      </View>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
  },
});

