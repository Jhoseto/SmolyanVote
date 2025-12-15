/**
 * API Configuration
 * Base URLs and endpoints for the backend
 */

// Development
const DEV_API_URL = 'http://localhost:2662';

// Production
const PROD_API_URL = 'https://smolyanvote.com';

// Determine environment
const isDevelopment = __DEV__;

export const API_CONFIG = {
  BASE_URL: isDevelopment ? DEV_API_URL : PROD_API_URL,
  WS_URL: isDevelopment 
    ? 'ws://localhost:2662/ws-svmessenger' 
    : 'wss://smolyanvote.com/ws-svmessenger',
  
  // API Endpoints
  ENDPOINTS: {
    // Auth
    AUTH: {
      LOGIN: '/api/mobile/auth/login',
      REFRESH: '/api/mobile/auth/refresh',
      LOGOUT: '/api/mobile/auth/logout',
    },
    
    // Device
    DEVICE: {
      REGISTER: '/api/mobile/device/register',
      UNREGISTER: '/api/mobile/device/unregister',
    },
    
    // Messenger
    MESSENGER: {
      CONVERSATIONS: '/api/svmessenger/conversations',
      MESSAGES: '/api/svmessenger/conversations/:id/messages',
      SEND_MESSAGE: '/api/svmessenger/conversations/:id/messages',
      SEARCH_USERS: '/api/svmessenger/users/search',
      CALL_TOKEN: '/api/svmessenger/call/token',
      START_CONVERSATION: '/api/svmessenger/conversations/start', // POST to start new conversation
    },
  },
  
  // Request timeout (ms)
  TIMEOUT: 30000,
  
  // Retry configuration
  RETRY: {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
  },
};

