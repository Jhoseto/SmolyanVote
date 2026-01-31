import { API_URL } from '../../config/api';
import { useAuthStore } from '../../store/authStore';
import { logger } from '../../utils/logger';

export const translateText = async (text: string, targetLanguage: string): Promise<string | null> => {
    try {
        const token = useAuthStore.getState().token;

        if (!token) {
            logger.error('No auth token available for translation');
            return null;
        }

        const response = await fetch(`${API_URL}/messenger/translate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                text,
                targetLanguage,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            logger.error(`Translation failed: ${response.status} ${errorText}`);
            return null;
        }

        const data = await response.json();
        return data.translated;
    } catch (error) {
        logger.error('Error translating text:', error);
        return null;
    }
};
