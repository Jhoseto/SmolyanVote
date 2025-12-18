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
    selectedConversationId,
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
  // НЕ refresh-ваме ако има отворен чат, за да не презапишем локалните промени
  useEffect(() => {
    if (isConnected) {
      // Refresh само ако няма отворен чат
      if (!selectedConversationId) {
        debouncedRefresh();
      } else {
        console.log('⏭️ Skipping conversations refresh on WebSocket connect - chat is open');
      }
    }
  }, [isConnected, selectedConversationId, debouncedRefresh]);

  return {
    conversations,
    isLoading,
    error,
    fetchConversations,
    selectConversation,
    markAsRead,
  };
};

