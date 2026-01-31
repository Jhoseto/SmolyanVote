import apiClient from './client';
import { API_CONFIG } from '../../config/api';
import { logger } from '../../utils/logger';

/**
 * Translate and save message (new per-user translation system)
 * Calls /translate-and-save which checks DB cache first
 */
export const translateAndSaveMessage = async (
    messageId: number,
    targetLanguage: string
): Promise<{ translatedText: string; cached: boolean } | null> => {
    try {
        const response = await apiClient.post(
            '/api/svmessenger/translate-and-save',
            {
                messageId,
                targetLanguage,
            }
        );

        return {
            translatedText: response.data.translatedText,
            cached: response.data.cached || false,
        };
    } catch (error) {
        logger.error('Error translating message:', error);
        return null;
    }
};
