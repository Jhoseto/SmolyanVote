/**
 * API Configuration
 * Base URLs and endpoints for the backend
 */

import { Platform } from 'react-native';

// Development Configuration
// За Android Studio Emulator използвай 10.0.2.2 (специален IP който сочи към localhost на host машината)
// За физическо устройство използвай IP адреса на твоя компютър в локалната мрежа
// 
// ИНСТРУКЦИИ:
// 1. Намери IP адреса на твоя компютър:
//    - Windows: ipconfig (търси IPv4 Address на активния адаптер)
//    - Mac/Linux: ifconfig или ip addr
// 2. Промени DEV_HOST_IP по-долу с твоя IP адрес (примерно: '192.168.1.100')
// 3. Уверете се че телефонът и компютърът са в една и съща Wi-Fi мрежа
// 4. Уверете се че firewall-ът на Windows позволява входящи връзки на порт 2662

// Промени този IP адрес с IP адреса на твоя компютър в локалната мрежа
// За да намериш IP адреса: Windows PowerShell -> ipconfig -> IPv4 Address
// ВАЖНО: Този IP адрес се използва само за физически устройства!
// За Android емулатор автоматично се използва 10.0.2.2
const DEV_HOST_IP = '192.168.1.100'; // ПРОМЕНИ ТОЗИ IP АДРЕС с IP адреса на твоя компютър!

// Константа за Android емулатор
const ANDROID_EMULATOR_IP = '10.0.2.2';

// Автоматично определяне на правилния адрес
// За Android емулатор използваме 10.0.2.2, за физическо устройство използваме DEV_HOST_IP
const getDevApiUrl = (): string => {
  // Ако има environment variable, използваме него (за по-голяма гъвкавост)
  if (process.env.DEV_API_HOST) {
    return `http://${process.env.DEV_API_HOST}:2662`;
  }
  
  // За Android устройства
  if (Platform.OS === 'android') {
    // За сега използваме DEV_HOST_IP за всички Android устройства
    // Ако искаш да използваш 10.0.2.2 само за емулатор, можеш да промениш логиката тук
    // или да използваш environment variable: DEV_API_HOST=10.0.2.2
    return `http://${DEV_HOST_IP}:2662`;
  } else if (Platform.OS === 'ios') {
    // iOS Simulator може да използва localhost
    return 'http://localhost:2662';
  }
  
  // Fallback
  return `http://${DEV_HOST_IP}:2662`;
};

const DEV_API_URL = getDevApiUrl();

// Production Configuration
// В production builds (release APK/IPA), __DEV__ автоматично е false
// и приложението ще използва production URL-ите
const PROD_API_URL = 'https://smolyanvote.com';
const PROD_WS_URL = 'https://smolyanvote.com/ws-svmessenger';

// Determine environment
// __DEV__ е автоматично зададена от React Native:
// - true в development/debug builds
// - false в production/release builds
const isDevelopment = __DEV__;

export const API_CONFIG = {
  // В production автоматично използва PROD_API_URL
  // В development използва DEV_API_URL (който зависи от платформата)
  BASE_URL: isDevelopment ? DEV_API_URL : PROD_API_URL,
  
  // WebSocket URL - същата логика
  WS_URL: isDevelopment
    ? `${DEV_API_URL}/ws-svmessenger` // WebSocket endpoint за development
    : PROD_WS_URL, // WebSocket endpoint за production
  
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

