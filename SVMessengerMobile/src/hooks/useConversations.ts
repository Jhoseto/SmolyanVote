/**
 * useConversations Hook
 * Hook за управление на conversations
 */

import { useEffect, useRef } from 'react';
import { useConversationsStore } from '../store/conversationsStore';
import { useWebSocket } from './useWebSocket';
import { debounce, APP_CONSTANTS } from '../utils/constants';

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

  // Оптимизация: Debounced refresh за conversations (избягва излишни API calls)
  const debouncedRefresh = useRef(
    debounce(() => {
      fetchConversations();
    }, APP_CONSTANTS.CONVERSATIONS_REFRESH_DEBOUNCE)
  ).current;

  useEffect(() => {
    fetchConversations();
  }, []);

  // Оптимизация: Refresh conversations when WebSocket connects (с debounce)
  useEffect(() => {
    if (isConnected) {
      debouncedRefresh();
    }
  }, [isConnected, debouncedRefresh]);

  return {
    conversations,
    isLoading,
    error,
    fetchConversations,
    selectConversation,
    markAsRead,
  };
};

