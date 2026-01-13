/**
 * useWebSocketConnection Hook
 * Управление на WebSocket connection lifecycle
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { svMobileWebSocketService } from '../services/websocket/stompClient';
import { useAuthStore } from '../store/authStore';
import { logger } from '../utils/logger';
import { API_CONFIG } from '../config/api';

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
      // CRITICAL FIX: Check if connection actually succeeded before showing error
      // Sometimes timeout fires but connection succeeds shortly after
      // This prevents false error messages when connection is actually working
      const isActuallyConnected = svMobileWebSocketService.isConnected();
      
      if (isActuallyConnected) {
        // Connection succeeded - don't show error or retry
        logger.debug('✅ [useWebSocketConnection] Connection succeeded despite timeout - ignoring error');
        isConnectingRef.current = false;
        setIsConnected(true);
        return;
      }

      // Handle different error types
      if (error?.message?.includes('timeout')) {
        // CRITICAL FIX: Only log timeout as warning, not error, if we haven't exceeded max retries
        // This reduces noise in logs when connection is retrying
        if (reconnectAttemptsRef.current < 3) {
          logger.warn('⏰ Connection timed out - retrying...');
        } else {
          logger.error('⏰ Connection timed out after multiple attempts - network issues or server unreachable');
        }
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
        // CRITICAL FIX: Check again if connection succeeded before retrying
        // This prevents unnecessary retry attempts if connection succeeded during timeout
        if (svMobileWebSocketService.isConnected()) {
          logger.debug('✅ [useWebSocketConnection] Connection succeeded during retry delay - cancelling retry');
          isConnectingRef.current = false;
          setIsConnected(true);
          reconnectAttemptsRef.current = 0; // Reset attempts on success
          return;
        }

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
      // Log connection attempt with URL for debugging
      logger.info(`🔌 [useWebSocketConnection] Attempting WebSocket connection to: ${API_CONFIG.WS_URL}`);

      // Reset reconnect attempts on successful connection start
      reconnectAttemptsRef.current = 0;

      // Create promise that resolves when connection succeeds or fails
      const connectionPromise = new Promise<void>((resolve, reject) => {
        svMobileWebSocketService.connect({
          ...callbacks,
          onConnect: () => {
            logger.info('✅ [useWebSocketConnection] WebSocket connected successfully');
            reconnectAttemptsRef.current = 0; // Reset attempts on success
            isConnectingRef.current = false;
            setIsConnected(true); // Update connection status
            if (callbacks.onConnect) callbacks.onConnect();
            resolve();
          },
          onError: (error: any) => {
            logger.error('❌ [useWebSocketConnection] WebSocket connection error:', error);
            isConnectingRef.current = false;
            setIsConnected(false); // Update connection status
            if (callbacks.onError) callbacks.onError(error);
            reject(error);
          }
        });
      });

      // CRITICAL FIX: Increased timeout to 30s for SockJS connections
      // SockJS can take longer to establish, especially on slow networks or when server is starting
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('WebSocket connection timeout')), 30000);
      });

      await Promise.race([connectionPromise, timeoutPromise]);
    } catch (error: any) {
      // CRITICAL FIX: Check if connection actually succeeded before handling error
      // Sometimes timeout fires but connection succeeds shortly after
      const isActuallyConnected = svMobileWebSocketService.isConnected();
      
      if (isActuallyConnected) {
        // Connection succeeded - don't show error or retry
        logger.debug('✅ [useWebSocketConnection] Connection succeeded despite timeout - ignoring error');
        isConnectingRef.current = false;
        setIsConnected(true);
        return;
      }

      logger.error('❌ [useWebSocketConnection] WebSocket connection failed:', error);
      isConnectingRef.current = false;
      setIsConnected(false); // Update connection status
      handleError(error);
    }
  }, [user]);

  const disconnectWebSocket = useCallback(() => {
    // CRITICAL FIX: Cancel any pending retry attempts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // CRITICAL FIX: Reset connection state
    isConnectingRef.current = false;
    reconnectAttemptsRef.current = 0;

    try {
      svMobileWebSocketService.disconnect();
      setIsConnected(false); // Update connection status
      logger.debug('✅ [useWebSocketConnection] WebSocket disconnected');
    } catch (error) {
      logger.error('❌ [useWebSocketConnection] Error disconnecting WebSocket:', error);
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
          // CRITICAL FIX: Reset reconnect attempts when connection succeeds
          if (connected) {
            reconnectAttemptsRef.current = 0;
            logger.debug('✅ [useWebSocketConnection] Connection status updated: connected');
          } else {
            logger.debug('⚠️ [useWebSocketConnection] Connection status updated: disconnected');
          }
          return connected;
        }
        return prevConnected;
      });
    };

    // Check immediately
    checkConnection();

    // Check periodically (every 5 seconds - reduced frequency to avoid battery drain)
    const interval = setInterval(checkConnection, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    connectWebSocket,
    disconnectWebSocket,
    isConnected,
  };
};
