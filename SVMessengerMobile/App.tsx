/**
 * SVMessenger Mobile App
 * Root component
 */

import React, { useRef } from 'react';
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

// Note: React Native automatically logs console.log/error/warn to Logcat
// No need for custom logging hooks - they can cause type errors
// For debugging: Use React Native Debugger (recommended) or Logcat
if (__DEV__) {
  console.log('🔧 [App] Development mode enabled');
  console.log('💡 Tip: Use React Native Debugger (Dev Menu → Debug) - best for React Native');
  console.log('💡 Tip: Use "adb logcat | Select-String ReactNativeJS" for native logs');
  console.log('💡 Tip: Chrome DevTools may not work properly with React 19.1.0');
  console.log('💡 Tip: To open DevTools manually, go to: http://localhost:8081/debugger-ui/');
}

function App() {
  // Reduce console.log spam - only log once per mount
  const renderCountRef = React.useRef(0);
  renderCountRef.current += 1;
  
  if (renderCountRef.current === 1 && __DEV__) {
    console.log('🎨 [App] Component rendering (first render)');
  }
  
  try {
    const isDarkMode = useColorScheme() === 'dark';

    // Monitor network status - hooks must be called unconditionally
    useNetworkStatus();

    // Initialize WebSocket connection - CRITICAL for real-time messaging and calls!
    // Note: This hook will only connect when user is authenticated
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
