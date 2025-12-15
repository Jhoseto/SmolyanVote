/**
 * useConversations Hook
 * Hook за управление на conversations
 */

import { useEffect } from 'react';
import { useConversationsStore } from '../store/conversationsStore';
import { useWebSocket } from './useWebSocket';

export const useConversations = () => {
  const {
    conversations,
    isLoading,
    error,
    fetchConversations,
    selectConversation,
    markAsRead,
  } = useConversationsStore();

  const { isConnected } = useWebSocket();

  useEffect(() => {
    fetchConversations();
  }, []);

  // Refresh conversations when WebSocket connects
  useEffect(() => {
    if (isConnected) {
      fetchConversations();
    }
  }, [isConnected]);

  return {
    conversations,
    isLoading,
    error,
    fetchConversations,
    selectConversation,
    markAsRead,
  };
};

