/**
 * useWebSocket Hook
 * Главен hook който комбинира всички WebSocket функционалности
 */

import { useCallback } from 'react';
import { useWebSocketConnection } from './useWebSocketConnection';
import { useWebSocketMessages } from './useWebSocketMessages';
import { useWebSocketStatus } from './useWebSocketStatus';
import { useWebSocketCalls } from './useWebSocketCalls';
import { useWebSocketTyping } from './useWebSocketTyping';

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

