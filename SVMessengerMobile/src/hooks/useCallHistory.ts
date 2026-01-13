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
    // CRITICAL FIX: Use == null to check for null/undefined, not !conversationId
    // This ensures conversationId 0 (a valid ID) is not treated as falsy
    if (conversationId == null) {
      setCallHistory([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const endpoint = API_CONFIG.ENDPOINTS.MESSENGER.CALL_HISTORY(conversationId);
      const response = await apiClient.get<CallHistory[]>(endpoint);
      const rawData = response.data || [];
      
      // CRITICAL: Validate and normalize call history data before setting state
      // This ensures all required fields are present and properly typed
      const callHistoryData: CallHistory[] = rawData
        .filter((item: any) => {
          // Filter out invalid entries
          return item && 
                 typeof item === 'object' && 
                 item.id != null && 
                 item.startTime != null &&
                 typeof item.startTime === 'string' &&
                 item.status != null &&
                 typeof item.status === 'string' &&
                 item.callerId != null &&
                 item.receiverId != null;
        })
        .map((item: any) => {
          // Normalize and ensure all fields are properly typed
          return {
            id: Number(item.id),
            conversationId: Number(item.conversationId || conversationId),
            callerId: Number(item.callerId),
            callerName: String(item.callerName || 'Потребител'),
            callerImageUrl: item.callerImageUrl ? String(item.callerImageUrl) : undefined,
            receiverId: Number(item.receiverId),
            receiverName: String(item.receiverName || 'Потребител'),
            receiverImageUrl: item.receiverImageUrl ? String(item.receiverImageUrl) : undefined,
            startTime: String(item.startTime), // Ensure it's a string
            endTime: item.endTime ? String(item.endTime) : undefined,
            durationSeconds: item.durationSeconds != null ? Number(item.durationSeconds) : undefined,
            status: String(item.status) as 'ACCEPTED' | 'REJECTED' | 'MISSED' | 'CANCELLED',
            isVideoCall: Boolean(item.isVideoCall || false),
          } as CallHistory;
        });
      
      setCallHistory(callHistoryData);
    } catch (err: any) {
      logger.error('❌ [useCallHistory] Failed to fetch call history:', err);
      logger.error('❌ [useCallHistory] Error details:', err.response?.data || err.message);
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
