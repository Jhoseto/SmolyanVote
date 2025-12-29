/**
 * SVMessenger Mobile App
 * Root component
 */

import React from 'react';
import { StatusBar, useColorScheme, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
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
    console.error('🚨 App Error Boundary caught an error:', error, errorInfo);
    // Log to console for debugging
    console.error('Error stack:', error.stack);
    console.error('Component stack:', errorInfo.componentStack);
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
  console.log('🎨 [App] Component rendering...');
  
  try {
    const isDarkMode = useColorScheme() === 'dark';
    console.log('🎨 [App] Dark mode:', isDarkMode);

    // Monitor network status - hooks must be called unconditionally
    try {
      console.log('📡 [App] Initializing network status...');
      useNetworkStatus();
      console.log('✅ [App] Network status initialized');
    } catch (error) {
      console.error('❌ [App] Error initializing network status:', error);
    }

    // Initialize WebSocket connection - CRITICAL for real-time messaging and calls!
    // Note: This hook will only connect when user is authenticated
    try {
      console.log('🔌 [App] Initializing WebSocket...');
      useWebSocket();
      console.log('✅ [App] WebSocket initialized');
    } catch (error) {
      console.error('❌ [App] Error initializing WebSocket:', error);
    }

    // Note: Push notifications are handled in AppNavigator.tsx
    console.log('🎨 [App] Rendering UI...');

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
  } catch (error: any) {
    console.error('❌ [App] CRITICAL ERROR in App component:', error);
    console.error('❌ [App] Error stack:', error?.stack);
    // Return minimal error screen
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#000' }}>
          Грешка в App компонента
        </Text>
        <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
          {error?.message || 'Неизвестна грешка'}
        </Text>
      </View>
    );
  }
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
  },
});

export default App;
