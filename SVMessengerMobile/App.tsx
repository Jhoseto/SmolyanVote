/**
 * SVMessenger Mobile App
 * Root component
 */

import React from 'react';
import { StatusBar, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { OfflineIndicator } from './src/components/common/OfflineIndicator';
import { useNetworkStatus } from './src/hooks/useNetworkStatus';
import { Colors } from './src/theme';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  
  // Monitor network status
  useNetworkStatus();

  // Note: Push notifications are handled in AppNavigator.tsx

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
