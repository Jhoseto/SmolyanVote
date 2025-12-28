/**
 * API Configuration
 * Base URLs and endpoints for the backend
 */

// Development - Choose based on your setup
// ВАЖНО: Промени DEV_DEVICE_IP на реалния IP адрес на компютъра ти в локалната мрежа
const DEV_DEVICE_IP = '192.168.1.100'; // ⚠️ ПРОМЕНИ ТОВА! Намери IP с: ipconfig (Windows) или ifconfig (Mac/Linux)

// За Android Studio Emulator използвай 10.0.2.2 (специален IP който сочи към localhost на host машината)
const DEV_EMULATOR_API_URL = 'http://10.0.2.2:2662'; // Android Emulator IP за localhost

// За физическо устройство използвай реалния IP адрес на компютъра в локалната мрежа
const DEV_DEVICE_API_URL = `http://${DEV_DEVICE_IP}:2662`; // Реален IP за физическо устройство

// Auto-detect: Emulator или физическо устройство
// Можеш да промениш USE_EMULATOR на false за да тествате на физическо устройство
const USE_EMULATOR = true; // ⚙️ Промени на false за физическо устройство

const DEV_API_URL = USE_EMULATOR ? DEV_EMULATOR_API_URL : DEV_DEVICE_API_URL;

// Production
const PROD_API_URL = 'https://smolyanvote.com';

// Determine environment
const isDevelopment = __DEV__;

console.log('⚙️ [API_CONFIG] Loading configuration...');
console.log('⚙️ [API_CONFIG] Environment:', isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION');
console.log('⚙️ [API_CONFIG] Using:', USE_EMULATOR ? 'EMULATOR' : 'PHYSICAL DEVICE');
console.log('⚙️ [API_CONFIG] API URL:', isDevelopment ? DEV_API_URL : PROD_API_URL);

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

