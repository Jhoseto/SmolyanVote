/**
 * SVMessenger Mobile App
 * Root component
 */

import React, { useEffect } from 'react';
import { StatusBar, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import messaging from '@react-native-firebase/messaging';
import { AppNavigator } from './src/navigation/AppNavigator';
import { OfflineIndicator } from './src/components/common/OfflineIndicator';
import { useNetworkStatus } from './src/hooks/useNetworkStatus';
import { Colors } from './src/theme';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  
  // Monitor network status
  useNetworkStatus();

  // Request notification permissions on app start
  useEffect(() => {
    const requestPermission = async () => {
      try {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          console.log('Notification permissions granted');
        } else {
          console.log('Notification permissions denied');
        }
      } catch (error) {
        console.error('Error requesting notification permissions:', error);
      }
    };

    requestPermission();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={Colors.green[500]}
      />
      <View style={{ flex: 1 }}>
        <AppNavigator />
        <OfflineIndicator />
      </View>
    </SafeAreaProvider>
  );
}

export default App;
