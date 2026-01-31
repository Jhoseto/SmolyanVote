/**
 * Translation Hook
 * Handles string translation based on current app language
 */

import { useUIStore } from '../store/uiStore';
import { translations } from '../translations';

export const useTranslation = () => {
    const language = useUIStore((state) => state.language);

    /**
     * Translate function
     * @param key Dot-notated key (e.g. 'settings.title')
     * @returns Translated string or the key if not found
     */
    const t = (key: string): string => {
        const langData = translations[language] || translations['bg'];

        const keys = key.split('.');
        let result = langData;

        for (const k of keys) {
            if (result && result[k]) {
                result = result[k];
            } else {
                // Fallback to Bulgarian if key not found in selected language
                const bgData = translations['bg'];
                let bgResult = bgData;
                for (const bk of keys) {
                    if (bgResult && bgResult[bk]) {
                        bgResult = bgResult[bk];
                    } else {
                        return key; // Return key if not found in bg either
                    }
                }
                return bgResult;
            }
        }

        return typeof result === 'string' ? result : key;
    };

    return { t, language };
};
