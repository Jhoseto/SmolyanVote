/**
 * useWebSocketConnection Hook
 * Управление на WebSocket connection lifecycle
 */

import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { svMobileWebSocketService } from '../services/websocket/stompClient';
import { useAuthStore } from '../store/authStore';

export const useWebSocketConnection = () => {
  const { isAuthenticated, user } = useAuthStore();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);

  const connectWebSocket = useCallback(async (callbacks = {}) => {
    if (!user || isConnectingRef.current) {
      return;
    }

    isConnectingRef.current = true;

    const handleError = (error: any) => {
      // Handle different error types
      if (error?.message?.includes('timeout')) {
        console.error('⏰ Connection timed out - network issues or server unreachable');
      } else if (error?.message?.includes('401') || error?.message?.includes('403')) {
        console.error('🔐 Authentication failed - token may be expired');
      } else if (error?.message?.includes('404')) {
        console.error('🔗 WebSocket endpoint not found - check server configuration');
      } else {
        console.error('🌐 Network or server error:', error?.message || error);
      }

      // Schedule retry with exponential backoff
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      const retryDelay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000); // Max 30 seconds
      reconnectAttemptsRef.current++;

      reconnectTimeoutRef.current = setTimeout(() => {
        console.log(`🔄 Retrying WebSocket connection (attempt ${reconnectAttemptsRef.current})...`);
        isConnectingRef.current = false; // Reset before retry
        connectWebSocket();
      }, retryDelay);
    };

    try {
      console.log('🔄 Connecting WebSocket for user:', user.email);

      // Reset reconnect attempts on successful connection start
      reconnectAttemptsRef.current = 0;

      // Create promise that resolves when connection succeeds or fails
      const connectionPromise = new Promise<void>((resolve, reject) => {
        svMobileWebSocketService.connect({
          ...callbacks,
          onConnect: () => {
            console.log('✅ WebSocket connected successfully');
            reconnectAttemptsRef.current = 0; // Reset attempts on success
            isConnectingRef.current = false;
            if (callbacks.onConnect) callbacks.onConnect();
            resolve();
          },
          onError: (error: any) => {
            console.error('❌ WebSocket connection error:', error);
            isConnectingRef.current = false;
            if (callbacks.onError) callbacks.onError(error);
            reject(error);
          }
        });
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('WebSocket connection timeout')), 10000);
      });

      await Promise.race([connectionPromise, timeoutPromise]);
    } catch (error: any) {
      console.error('❌ WebSocket connection failed:', error);
      isConnectingRef.current = false;
      handleError(error);
    }
  }, [user]);

  const disconnectWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    try {
      svMobileWebSocketService.disconnect();
      console.log('✅ WebSocket disconnected');
    } catch (error) {
      console.error('❌ Error disconnecting WebSocket:', error);
    }
  }, []);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('📱 App state changed:', nextAppState);

      if (nextAppState === 'active') {
        // App became active - reconnect WebSocket if needed
        if (isAuthenticated && user && !svMobileWebSocketService.isConnected() && !isConnectingRef.current) {
          console.log('🔄 App became active, reconnecting WebSocket...');
          connectWebSocket();
        }
      } else if (nextAppState === 'background') {
        // App went to background - can disconnect or keep connection
        // For now, keep connection for notifications
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, user, connectWebSocket]);

  // Connect WebSocket when authenticated
  useEffect(() => {
    if (isAuthenticated && user && !svMobileWebSocketService.isConnected() && !isConnectingRef.current) {
      console.log('🔄 User authenticated, connecting WebSocket...');
      connectWebSocket();
    } else if (!isAuthenticated && svMobileWebSocketService.isConnected()) {
      console.log('🔌 User logged out, disconnecting WebSocket...');
      disconnectWebSocket();
    }
  }, [isAuthenticated, user, connectWebSocket, disconnectWebSocket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    connectWebSocket,
    disconnectWebSocket,
    isConnected: svMobileWebSocketService.isConnected(),
  };
};
