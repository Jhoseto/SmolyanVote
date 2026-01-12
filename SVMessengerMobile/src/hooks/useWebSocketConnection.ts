/**
 * useWebSocketConnection Hook
 * Управление на WebSocket connection lifecycle
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { svMobileWebSocketService } from '../services/websocket/stompClient';
import { useAuthStore } from '../store/authStore';
import { logger } from '../utils/logger';

export const useWebSocketConnection = () => {
  const { isAuthenticated, user } = useAuthStore();
  const reconnectTimeoutRef = useRef<number | null>(null);
  const isConnectingRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  
  // Use state to track connection status reactively
  const [isConnected, setIsConnected] = useState(false);

  const connectWebSocket = useCallback(async (callbacks = {}) => {
    if (!user || isConnectingRef.current) {
      return;
    }

    isConnectingRef.current = true;

    // CRITICAL FIX Bug 1: Capture callbacks in closure for retry
    // This ensures retry uses the original callbacks from the failed attempt,
    // not whatever callbacks are in the ref when retry fires
    const capturedCallbacks = { ...callbacks };

    const handleError = (error: any) => {
      // Handle different error types
      if (error?.message?.includes('timeout')) {
        logger.error('⏰ Connection timed out - network issues or server unreachable');
      } else if (error?.message?.includes('401') || error?.message?.includes('403')) {
        logger.error('🔐 Authentication failed - token may be expired');
      } else if (error?.message?.includes('404')) {
        logger.error('🔗 WebSocket endpoint not found - check server configuration');
      } else {
        logger.error('🌐 Network or server error:', error?.message || error);
      }

      // Schedule retry with exponential backoff
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      const retryDelay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000); // Max 30 seconds
      reconnectAttemptsRef.current++;

      reconnectTimeoutRef.current = setTimeout(() => {
        isConnectingRef.current = false; // Reset before retry
        // CRITICAL FIX Bug 1: Use captured callbacks from closure, not mutable ref
        // This ensures callback continuity - retry uses the same callbacks as the original failed attempt
        // CRITICAL FIX: Handle promise rejection to prevent unhandled promise rejections
        connectWebSocket(capturedCallbacks).catch((retryError) => {
          // Error is already handled by handleError callback in connectWebSocket
          // This catch prevents unhandled promise rejection
          logger.error('❌ [useWebSocketConnection] Retry connection failed:', retryError);
        });
      }, retryDelay);
    };

    try {

      // Reset reconnect attempts on successful connection start
      reconnectAttemptsRef.current = 0;

      // Create promise that resolves when connection succeeds or fails
      const connectionPromise = new Promise<void>((resolve, reject) => {
        svMobileWebSocketService.connect({
          ...callbacks,
          onConnect: () => {
            reconnectAttemptsRef.current = 0; // Reset attempts on success
            isConnectingRef.current = false;
            setIsConnected(true); // Update connection status
            if (callbacks.onConnect) callbacks.onConnect();
            resolve();
          },
          onError: (error: any) => {
            console.error('❌ WebSocket connection error:', error);
            isConnectingRef.current = false;
            setIsConnected(false); // Update connection status
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
      setIsConnected(false); // Update connection status
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
      setIsConnected(false); // Update connection status
    } catch (error) {
      console.error('❌ Error disconnecting WebSocket:', error);
      setIsConnected(false); // Update connection status even on error
    }
  }, []);

  // Handle app state changes
  // NOTE: Reconnection should be handled by useWebSocket hook with proper callbacks
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // Reconnection is handled by useWebSocket hook
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  // NOTE: WebSocket connection with callbacks should be handled by useWebSocket hook
  // This effect only handles automatic connection, but callbacks must be set up separately
  // The actual connection with callbacks happens in useWebSocket hook

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Check connection status periodically and on mount
  // CRITICAL FIX Bug 2: Don't update state if connection is in progress to prevent race conditions
  useEffect(() => {
    const checkConnection = () => {
      // Don't update state if we're currently connecting - this prevents race conditions
      // where polling reports disconnected while async connection is in progress
      if (isConnectingRef.current) {
        return; // Skip update during connection attempts
      }
      
      const connected = svMobileWebSocketService.isConnected();
      setIsConnected((prevConnected) => {
        // Only update if state actually changed to avoid unnecessary re-renders
        if (prevConnected !== connected) {
          return connected;
        }
        return prevConnected;
      });
    };

    // Check immediately
    checkConnection();

    // Check periodically (every 2 seconds)
    const interval = setInterval(checkConnection, 2000);

    return () => clearInterval(interval);
  }, []);

  return {
    connectWebSocket,
    disconnectWebSocket,
    isConnected,
  };
};
