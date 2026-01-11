/**
 * useCallHistory Hook
 * Hook за управление на call history в конкретен conversation
 */

import { useState, useEffect, useCallback } from 'react';
import { CallHistory } from '../types/callHistory';
import { API_CONFIG } from '../config/api';
import apiClient from '../services/api/client';
import { logger } from '../utils/logger';

export const useCallHistory = (conversationId: number | null) => {
  const [callHistory, setCallHistory] = useState<CallHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCallHistory = useCallback(async () => {
    if (!conversationId) {
      setCallHistory([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const endpoint = API_CONFIG.ENDPOINTS.MESSENGER.CALL_HISTORY(conversationId);
      const response = await apiClient.get<CallHistory[]>(endpoint);
      setCallHistory(response.data || []);
    } catch (err: any) {
      logger.error('Failed to fetch call history:', err);
      setError(err.message || 'Failed to load call history');
      setCallHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchCallHistory();
  }, [fetchCallHistory]);

  return {
    callHistory,
    isLoading,
    error,
    refreshCallHistory: fetchCallHistory,
  };
};
