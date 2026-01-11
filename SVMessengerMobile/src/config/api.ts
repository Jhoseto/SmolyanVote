/**
 * API Configuration
 * Base URLs and endpoints for the backend
 */

// Development - Choose based on your setup
// Използвай environment variable или fallback стойности
// За да зададеш DEV_DEVICE_IP, създай .env файл с: DEV_DEVICE_IP=192.168.1.100
// Или използвай react-native-config за по-добра поддръжка на environment variables
const DEV_DEVICE_IP = (process.env.DEV_DEVICE_IP as string) || '192.168.1.100'; // Fallback стойност

// За Android Studio Emulator използвай 10.0.2.2 (специален IP който сочи към localhost на host машината)
const DEV_EMULATOR_API_URL = 'http://10.0.2.2:2662'; // Android Emulator IP за localhost

// За физическо устройство използвай реалния IP адрес на компютъра в локалната мрежа
const DEV_DEVICE_API_URL = `http://${DEV_DEVICE_IP}:2662`; // Реален IP за физическо устройство

// Auto-detect: Emulator или физическо устройство
// Можеш да зададеш USE_EMULATOR в .env файл: USE_EMULATOR=false за физическо устройство
// Default: true (emulator) - задай USE_EMULATOR=false за да използваш физическо устройство
const USE_EMULATOR = process.env.USE_EMULATOR !== 'false'; // Default: true (emulator), set to 'false' to disable

const DEV_API_URL = USE_EMULATOR ? DEV_EMULATOR_API_URL : DEV_DEVICE_API_URL;

// Production
const PROD_API_URL = 'https://smolyanvote.com';

// Determine environment
const isDevelopment = __DEV__;

export const API_CONFIG = {
  BASE_URL: isDevelopment ? DEV_API_URL : PROD_API_URL,
  WS_URL: isDevelopment
    ? USE_EMULATOR 
      ? 'http://10.0.2.2:2662/ws-svmessenger' // Android Emulator IP за localhost - SockJS endpoint за mobile
      : `http://${DEV_DEVICE_IP}:2662/ws-svmessenger` // Физическо устройство - SockJS endpoint
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
      DELETE_CONVERSATION: '/api/svmessenger/conversations/:id', // DELETE /api/svmessenger/conversations/{id}
      HIDE_CONVERSATION: '/api/svmessenger/conversations/:id/hide', // PUT /api/svmessenger/conversations/{id}/hide
      MARK_AS_READ: '/api/svmessenger/conversations/:id/read', // PUT /api/svmessenger/conversations/{id}/read
      MESSAGES: '/api/svmessenger/messages/conversation/:id', // GET /api/svmessenger/messages/conversation/{id}
      SEND_MESSAGE: '/api/svmessenger/messages/send', // POST /api/svmessenger/messages/send
      EDIT_MESSAGE: '/api/svmessenger/messages/:id/edit', // PUT /api/svmessenger/messages/{id}/edit
      DELETE_MESSAGE: '/api/svmessenger/messages/:id', // DELETE /api/svmessenger/messages/{id}
      SEARCH_USERS: '/api/svmessenger/users/search',
      SEARCH_FOLLOWING: '/api/svmessenger/users/following', // GET /api/svmessenger/users/following?query=
      CALL_TOKEN: '/api/svmessenger/call/token',
      START_CONVERSATION: '/api/svmessenger/conversations/start', // POST to start new conversation
    },
    
    // Profile
    PROFILE: {
      GET: '/api/mobile/profile', // GET /api/mobile/profile
      UPDATE: '/api/mobile/profile/update', // PUT /api/mobile/profile/update
    },
    
    // Registration
    REGISTRATION: '/api/user/registration', // POST /api/user/registration
  },
  
  // Request timeout (ms)
  TIMEOUT: 30000,
  
  // Retry configuration
  RETRY: {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
  },
};

