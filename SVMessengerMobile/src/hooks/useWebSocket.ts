/**
 * useWebSocket Hook
 * Главен hook който комбинира всички WebSocket функционалности
 */

import React, { useCallback, useRef } from 'react';
import { useWebSocketConnection } from './useWebSocketConnection';
import { useWebSocketMessages } from './useWebSocketMessages';
import { useWebSocketStatus } from './useWebSocketStatus';
import { useWebSocketCalls } from './useWebSocketCalls';
import { useWebSocketTyping } from './useWebSocketTyping';
import { useAuthStore } from '../store/authStore';
import { svMobileWebSocketService } from '../services/websocket/stompClient';
import { logger } from '../utils/logger';

export const useWebSocket = () => {
  // Message handling
  const { sendMessage, sendReadReceipt, sendTypingStatus, handleNewMessage, handleReadReceipt, handleDeliveryReceipt } = useWebSocketMessages();

  // Online status handling
  const { handleOnlineStatus } = useWebSocketStatus();

  // Call handling
  const { sendCallSignal, handleCallSignal } = useWebSocketCalls();

  // Typing status handling
  const { subscribeToTypingStatus, unsubscribeFromTypingStatus, handleTypingStatus } = useWebSocketTyping();

  // Connection management with callbacks
  const { connectWebSocket, disconnectWebSocket, isConnected } = useWebSocketConnection();

  // Track if we've already initiated an auto-connect attempt to prevent duplicates
  const autoConnectAttemptedRef = useRef(false);

  // Enhanced connect function that includes all callbacks
  const enhancedConnectWebSocket = useCallback(async () => {
    return connectWebSocket({
      onNewMessage: handleNewMessage,
      onReadReceipt: handleReadReceipt,
      onDeliveryReceipt: handleDeliveryReceipt,
      onOnlineStatus: handleOnlineStatus,
      onCallSignal: handleCallSignal,
      onTypingStatus: handleTypingStatus,
    });
  }, [connectWebSocket, handleNewMessage, handleReadReceipt, handleDeliveryReceipt, handleOnlineStatus, handleCallSignal, handleTypingStatus]);

  // Auto-connect when authenticated (with callbacks)
  // CRITICAL FIX: Only trigger on authentication state changes, not on isConnected/enhancedConnectWebSocket changes
  // This prevents duplicate connection attempts when polling updates isConnected or callbacks change
  const { isAuthenticated, user } = useAuthStore();
  // CRITICAL FIX Bug 2: Initialize ref to false to ensure auto-connect triggers on mount with authenticated user
  // If initialized with isAuthenticated, first render with authenticated=true won't trigger auto-connect
  const prevIsAuthenticatedRef = useRef(false);
  const isFirstMountRef = useRef(true);
  
  React.useEffect(() => {
    const wasAuthenticated = prevIsAuthenticatedRef.current;
    const isNowAuthenticated = isAuthenticated;
    const isFirstMount = isFirstMountRef.current;
    
    // Reset flag when user logs out (transition from authenticated to unauthenticated)
    if (!isNowAuthenticated && wasAuthenticated) {
      autoConnectAttemptedRef.current = false;
    }
    
    // Auto-connect on first mount if authenticated, or when user becomes authenticated (transition from false to true)
    // CRITICAL FIX: Only reset flag on authentication transition, not on every render
    if (isNowAuthenticated && user && (isFirstMount || (!wasAuthenticated && isNowAuthenticated))) {
      // Reset auto-connect flag ONLY when user transitions from unauthenticated to authenticated
      // This ensures we can retry connection if it failed during previous session
      if (!wasAuthenticated && isNowAuthenticated) {
        autoConnectAttemptedRef.current = false;
      }
      
      // Auto-connect only if:
      // 1. Not already connected
      // 2. Not currently connecting
      // 3. Haven't already attempted auto-connect for this session
      if (!isConnected && !svMobileWebSocketService.getIsConnecting() && !autoConnectAttemptedRef.current) {
        autoConnectAttemptedRef.current = true; // Mark as attempted to prevent duplicates
        logger.info('🔌 [useWebSocket] Auto-connecting WebSocket...');
        enhancedConnectWebSocket().catch((error) => {
          logger.error('❌ [useWebSocket] Auto-connect failed:', error);
          // Don't reset flag - let retry mechanism in useWebSocketConnection handle reconnection
        });
      }
    }
    
    // Update refs for next render
    prevIsAuthenticatedRef.current = isAuthenticated;
    isFirstMountRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]); // Only depend on auth state, not isConnected or enhancedConnectWebSocket

  return {
    // Connection management
    connectWebSocket: enhancedConnectWebSocket,
    disconnectWebSocket,
    isConnected,

    // Message operations
    sendMessage,
    sendReadReceipt,
    sendTypingStatus,

    // Call operations
    sendCallSignal,

    // Typing operations
    subscribeToTypingStatus,
    unsubscribeFromTypingStatus,
  };
};

