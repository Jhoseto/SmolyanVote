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
    ? 'http://10.0.2.2:2662/ws-svmessenger' // Android Emulator IP за localhost - SockJS endpoint за mobile
    : 'https://smolyanvote.com/ws-svmessenger', // SockJS endpoint за production
  
  // API Endpoints
  ENDPOINTS: {
    // Auth
    AUTH: {
      LOGIN: '/api/mobile/auth/login',
      REFRESH: '/api/mobile/auth/refresh',
      LOGOUT: '/api/mobile/auth/logout',
      OAUTH: '/api/mobile/auth/oauth',
    },
    
    // Heartbeat (for online status)
    HEARTBEAT: '/heartbeat',
    
    // Device
    DEVICE: {
      REGISTER: '/api/mobile/device/register',
      UNREGISTER: '/api/mobile/device/unregister',
    },
    
    // Messenger
    MESSENGER: {
      CONVERSATIONS: '/api/svmessenger/conversations',
      GET_CONVERSATION: '/api/svmessenger/conversations/:id', // GET /api/svmessenger/conversations/{id}
      MARK_AS_READ: '/api/svmessenger/conversations/:id/read', // PUT /api/svmessenger/conversations/{id}/read
      MESSAGES: '/api/svmessenger/messages/conversation/:id', // GET /api/svmessenger/messages/conversation/{id}
      SEND_MESSAGE: '/api/svmessenger/messages/send', // POST /api/svmessenger/messages/send
      SEARCH_USERS: '/api/svmessenger/users/search',
      SEARCH_FOLLOWING: '/api/svmessenger/users/following', // GET /api/svmessenger/users/following?query=
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

