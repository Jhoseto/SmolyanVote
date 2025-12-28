/**
 * SVMessenger Mobile App
 * Root component
 */

import React from 'react';
import { StatusBar, useColorScheme, View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppNavigator } from './src/navigation/AppNavigator';
import { OfflineIndicator } from './src/components/common/OfflineIndicator';
import { useNetworkStatus } from './src/hooks/useNetworkStatus';
import { useWebSocket } from './src/hooks/useWebSocket';
import { Colors } from './src/theme';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Грешка в приложението</Text>
          <Text style={styles.errorDetails}>{this.state.error?.message}</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  
  // Monitor network status
  useNetworkStatus();

  // Initialize WebSocket connection - CRITICAL for real-time messaging and calls!
  useWebSocket();

  // Note: Push notifications are handled in AppNavigator.tsx

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
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
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
  },
  errorDetails: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default App;
