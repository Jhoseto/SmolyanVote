/**
 * App Constants
 * Константи за приложението
 */

export const APP_CONSTANTS = {
  // Message limits
  MAX_MESSAGE_LENGTH: 1000,
  MIN_MESSAGE_LENGTH: 1,

  // Pagination
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,

  // Debounce delays (ms)
  TYPING_DEBOUNCE: 300,
  SEARCH_DEBOUNCE: 500,

  // Timeouts (ms)
  TYPING_TIMEOUT: 3000,
  CONNECTION_TIMEOUT: 10000,
  REQUEST_TIMEOUT: 30000,

  // Retry
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,

  // Cache
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
};

// Debounce helper function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export const ROUTES = {
  AUTH: {
    LOGIN: 'Login',
    REGISTER: 'Register',
    FORGOT_PASSWORD: 'ForgotPassword',
  },
  MAIN: {
    CONVERSATIONS: 'Conversations',
    CHAT: 'Chat',
    SEARCH: 'Search',
    PROFILE: 'Profile',
  },
};

