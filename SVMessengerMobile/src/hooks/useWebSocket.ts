/**
 * useWebSocket Hook
 * Главен hook който комбинира всички WebSocket функционалности
 */

import React, { useCallback } from 'react';
import { useWebSocketConnection } from './useWebSocketConnection';
import { useWebSocketMessages } from './useWebSocketMessages';
import { useWebSocketStatus } from './useWebSocketStatus';
import { useWebSocketCalls } from './useWebSocketCalls';
import { useWebSocketTyping } from './useWebSocketTyping';
import { useAuthStore } from '../store/authStore';
import { svMobileWebSocketService } from '../services/websocket/stompClient';

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
  const { isAuthenticated, user } = useAuthStore();
  React.useEffect(() => {
    if (isAuthenticated && user && !isConnected && !svMobileWebSocketService.getIsConnecting()) {
      enhancedConnectWebSocket();
    }
  }, [isAuthenticated, user, isConnected, enhancedConnectWebSocket]);

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

