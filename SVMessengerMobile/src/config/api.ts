/**
 * API Configuration
 * Base URLs and endpoints for the backend
 */

// Development
// За Android Studio Emulator използвай 10.0.2.2 (специален IP който сочи към localhost на host машината)
// За физическо устройство използвай IP адреса на твоя компютър (примерно 192.168.1.100)
const DEV_API_URL = 'http://10.0.2.2:2662'; // Android Emulator IP за localhost

// Production
const PROD_API_URL = 'https://smolyanvote.com';

// Determine environment
const isDevelopment = __DEV__;

export const API_CONFIG = {
  BASE_URL: isDevelopment ? DEV_API_URL : PROD_API_URL,
  WS_URL: isDevelopment 
    ? 'ws://10.0.2.2:2662/ws-svmessenger-ws' // Android Emulator IP за localhost - plain WebSocket endpoint
    : 'wss://smolyanvote.com/ws-svmessenger-ws', // Plain WebSocket endpoint за production
  
  // API Endpoints
  ENDPOINTS: {
    // Auth
    AUTH: {
      LOGIN: '/api/mobile/auth/login',
      REFRESH: '/api/mobile/auth/refresh',
      LOGOUT: '/api/mobile/auth/logout',
      OAUTH: '/api/mobile/auth/oauth',
    },
    
    // Device
    DEVICE: {
      REGISTER: '/api/mobile/device/register',
      UNREGISTER: '/api/mobile/device/unregister',
    },
    
    // Messenger
    MESSENGER: {
      CONVERSATIONS: '/api/svmessenger/conversations',
      MESSAGES: '/api/svmessenger/messages/conversation/:id', // GET /api/svmessenger/messages/conversation/{id}
      SEND_MESSAGE: '/api/svmessenger/messages/send', // POST /api/svmessenger/messages/send
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

