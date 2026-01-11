/**
 * SVMessenger WebSocket Service за React Native
 * Използва custom SockJS implementation за съвместимост с backend
 */

import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_CONFIG } from '../../config/api';
import { TokenManager } from '../auth/tokenManager';
import { safeErrorToString } from '../../utils/safeLog';
import { logger } from '../../utils/logger';
import { WebSocketCallbacks, CallSignal } from '../../types/websocket';

class SVMobileWebSocketService {
  // Деклариране на properties (задължително в TypeScript)
  private client: Client | null;
  private connected: boolean;
  private subscriptions: Map<string, any>;
  private reconnectAttempts: number;
  private maxReconnectAttempts: number;
  private reconnectDelay: number;
  private isConnecting: boolean;
  private tokenManager: TokenManager;
  private currentCallbacks: WebSocketCallbacks | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null; // Debouncing за reconnection

  constructor() {
    this.client = null;
    this.connected = false;
    this.subscriptions = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.isConnecting = false; // Защита срещу множествени извиквания на connect
    // Lazy initialization of TokenManager to prevent crashes
    try {
      this.tokenManager = new TokenManager();
    } catch (error) {
      logger.error('❌ [WebSocketService] Failed to initialize TokenManager:', error);
      // Create a dummy token manager to prevent crash
      this.tokenManager = {
        getAccessToken: async () => null,
        getRefreshToken: async () => null,
        setTokens: async () => {},
        clearTokens: async () => {},
        hasTokens: async () => false,
      } as any;
    }
    this.currentCallbacks = null;
  }

  /**
   * Connect към WebSocket server
   */
  async connect(callbacks: WebSocketCallbacks = {}) {
    // Защита срещу множествени извиквания - ако вече се connect-ва, не прави нищо
    if (this.isConnecting || (this.client && this.client.connected)) {
      return;
    }

    this.isConnecting = true;

    const {
      onConnect = () => {},
      onDisconnect = () => {},
      onError = () => {},
      onNewMessage = () => {},
      onTypingStatus = () => {},
      onReadReceipt = () => {},
      onDeliveryReceipt = () => {},
      onOnlineStatus = () => {},
      onCallSignal = () => {}
    } = callbacks;

    // Премахни стария client преди да създадеш нов (предотвратява дублиране на subscriptions)
    if (this.client) {
      try {
        // Unsubscribe от всички channels
        this.subscriptions.forEach(sub => {
          try {
            sub.unsubscribe();
          } catch (e) {
            // Ignore errors during cleanup
          }
        });
        this.subscriptions.clear();

        // Deactivate стария client
        if (this.client.connected) {
          this.client.deactivate();
        }
      } catch (error) {
        logger.error('Error disconnecting old client:', error);
      }
      this.client = null;
      this.connected = false;
    }

    try {
      // Извличане на JWT token
      const token = await this.tokenManager.getAccessToken();
      if (!token) {
        throw new Error('No access token available for WebSocket connection');
      }

      // Create plain WebSocket connection URL with token
      const wsUrl = API_CONFIG.WS_URL;

      // Create STOMP client with SockJS (standard approach за React Native + Spring Boot)
      this.client = new Client({
        webSocketFactory: () => new SockJS(wsUrl),

        // STOMP connect headers с JWT token
        connectHeaders: {
          'Authorization': `Bearer ${token}`
        },

        // Debug logging disabled - само грешки се логват
        debug: () => {
          // No debug logging
        },

        // Reconnect settings
        reconnectDelay: this.reconnectDelay,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,

        // Connection success callback
        onConnect: () => {
          // Защита срещу множествени извиквания на onConnect
          if (this.connected) {
            return;
          }

          this.connected = true;
          this.isConnecting = false; // Reset connecting flag
          this.reconnectAttempts = 0;

          // Subscribe to channels
          this.subscribeToChannels({
              onNewMessage,
              onTypingStatus,
              onReadReceipt,
              onDeliveryReceipt,
              onOnlineStatus,
              onCallSignal
          });

          onConnect();
        },

        // Connection error callback
        onStompError: (frame) => {
          logger.error('❌ STOMP connection error:', frame);
          this.connected = false;
          this.isConnecting = false; // Reset connecting flag
          onError(frame);

          // Retry connection
          this.handleReconnect();
        },

        // WebSocket close callback
        onWebSocketClose: () => {
          this.connected = false;
          this.isConnecting = false; // Reset connecting flag
          onDisconnect();

          // Retry connection
          this.handleReconnect();
        }
      });

      // Activate connection
      this.client.activate();

    } catch (error) {
      logger.error('❌ Error setting up WebSocket connection:', error);
      this.connected = false;
      this.isConnecting = false;
      onError(error);
    }
  }

  /**
   * Helper function to safely call callbacks with error handling
   * Handles both sync and async callbacks, prevents unhandled promise rejections
   * CRITICAL: Never calls .catch() on undefined - only on actual promises
   */
  private safeCallCallback(callback: ((data: unknown) => void | Promise<void>) | undefined, data: unknown, callbackName: string): void {
    if (!callback || typeof callback !== 'function') {
      return;
    }

    try {
      // Call callback - it may return a promise or nothing
      const result = callback(data);
      
      // ONLY handle promises - if result is not a promise, do nothing
      // This prevents "Cannot read property 'catch' of undefined" errors
      if (result != null && 
          typeof result === 'object' && 
          typeof result.then === 'function' && 
          typeof result.catch === 'function') {
        // It's a valid promise - attach error handler
        result.catch((callbackError: any) => {
          this.logErrorSafely(callbackError, `${callbackName} callback`);
        });
      }
      // If result is not a promise, do nothing - no error handling needed
    } catch (callbackError) {
      // Handle synchronous errors only
      this.logErrorSafely(callbackError, `executing ${callbackName} callback`);
    }
  }

  /**
   * Safely log errors - ensures we never try to call .catch() on undefined
   * CRITICAL: Never pass promises or objects with .catch() to logger.error
   */
  private logErrorSafely(error: unknown, context: string): void {
    try {
      // Convert error to a safe string representation using helper function
      const errorMessage = safeErrorToString(error);
      const logMessage = `❌ [stompClient] Error in ${context}: ${errorMessage}`;
      
      // Use logger.error which handles errors safely
      logger.error(logMessage);
    } catch (logError) {
      // If even error conversion fails, use absolute minimal logging
      try {
        logger.error(`❌ [stompClient] Error in ${context}: [Failed to process error]`);
      } catch {
        // Do nothing - prevent infinite error loops
      }
    }
  }

  /**
   * Subscribe to WebSocket channels
   */
  subscribeToChannels(callbacks: WebSocketCallbacks) {
    const { onNewMessage, onTypingStatus, onReadReceipt, onDeliveryReceipt, onOnlineStatus, onCallSignal } = callbacks;

    // ВАЖНО: Запазваме callbacks в instance променливи за да избегнем stale closures
    // Когато callback-ът се промени, subscription-ът трябва да използва новия callback
    this.currentCallbacks = callbacks;

    // Премахни старите subscriptions преди да създадеш нови
    const coreSubscriptionKeys = ['messages', 'receipts', 'delivery', 'status', 'callSignals'];
    coreSubscriptionKeys.forEach(key => {
      const oldSub = this.subscriptions.get(key);
      if (oldSub) {
        try {
          oldSub.unsubscribe();
        } catch (error) {
          logger.error('Error unsubscribing old subscription:', key, error);
        }
        this.subscriptions.delete(key);
      }
    });

    if (!this.client) {
      logger.error('❌ [stompClient] Cannot subscribe - client is null');
      return;
    }

    try {
      // 1. Private messages channel
      // ВАЖНО: Използваме this.currentCallbacks.onNewMessage за да винаги използваме най-новия callback
      const messagesSub = this.client.subscribe(
        '/user/queue/svmessenger-messages',
        (message) => {
          try {
            // Validate message exists and has body
            if (!message || !message.body) {
              logger.error('❌ [stompClient] Received message without body:', message);
              return;
            }

            // Parse message body safely
            let data;
            try {
              data = JSON.parse(message.body);
            } catch (parseError) {
              logger.error('❌ [stompClient] Failed to parse message body as JSON:', {
                error: parseError,
                body: message.body,
                bodyType: typeof message.body,
                bodyLength: message.body?.length,
              });
              return;
            }

            // Validate parsed data
            if (!data || typeof data !== 'object') {
              logger.error('❌ [stompClient] Parsed data is not an object:', data);
              return;
            }

            // Get callback safely and call it using helper function
            const currentCallback = this.currentCallbacks?.onNewMessage;
            if (currentCallback && typeof currentCallback === 'function') {
              this.safeCallCallback(currentCallback, data, 'onNewMessage');
            } else {
              logger.error('❌ [stompClient] onNewMessage callback is not available or not a function!', {
                hasCallbacks: !!this.currentCallbacks,
                hasOnNewMessage: !!this.currentCallbacks?.onNewMessage,
                type: typeof this.currentCallbacks?.onNewMessage,
              });
            }
          } catch (error) {
            // Safely log error without accessing potentially undefined properties
            logger.error('❌ [stompClient] Error processing message:', error);
            try {
              logger.error('❌ [stompClient] Message details:', {
                hasMessage: !!message,
                hasBody: !!message?.body,
                bodyType: typeof message?.body,
                hasHeaders: !!message?.headers,
              });
            } catch (logError) {
              logger.error('❌ [stompClient] Failed to log message details:', logError);
            }
          }
        }
      );
      this.subscriptions.set('messages', messagesSub);

      // 2. Read receipts channel
      const receiptsSub = this.client!.subscribe(
        '/user/queue/svmessenger-read-receipts',
        (message) => {
          try {
            if (!message || !message.body) {
              logger.error('❌ [stompClient] Received receipt without body:', message);
              return;
            }
            const data = JSON.parse(message.body);
            const currentCallback = this.currentCallbacks?.onReadReceipt;
            this.safeCallCallback(currentCallback, data, 'onReadReceipt');
          } catch (error) {
            logger.error('❌ [stompClient] Error parsing receipt:', error);
          }
        }
      );
      this.subscriptions.set('receipts', receiptsSub);

      // 3. Delivery receipts channel
      const deliverySub = this.client!.subscribe(
        '/user/queue/svmessenger-delivery-receipts',
        (message) => {
          try {
            if (!message || !message.body) {
              logger.error('❌ [stompClient] Received delivery receipt without body:', message);
              return;
            }
            const data = JSON.parse(message.body);
            const currentCallback = this.currentCallbacks?.onDeliveryReceipt;
            this.safeCallCallback(currentCallback, data, 'onDeliveryReceipt');
          } catch (error) {
            logger.error('❌ [stompClient] Error parsing delivery receipt:', error);
          }
        }
      );
      this.subscriptions.set('delivery', deliverySub);

      // 4. Online status channel
      const statusSub = this.client!.subscribe(
        '/topic/svmessenger-online-status',
        (message) => {
          try {
            if (!message || !message.body) {
              logger.error('❌ [stompClient] Received status without body:', message);
              return;
            }
            const data = JSON.parse(message.body);
            const currentCallback = this.currentCallbacks?.onOnlineStatus;
            this.safeCallCallback(currentCallback, data, 'onOnlineStatus');
          } catch (error) {
            logger.error('❌ [stompClient] Error parsing status:', error);
          }
        }
      );
      this.subscriptions.set('status', statusSub);

      // 5. Call signals channel
      const callSignalsSub = this.client!.subscribe(
        '/user/queue/svmessenger-call-signals',
        (message) => {
          try {
            if (!message || !message.body) {
              logger.error('❌ [stompClient] Received call signal without body:', message);
              return;
            }
            const data = JSON.parse(message.body) as CallSignal;
            const currentCallback = this.currentCallbacks?.onCallSignal;
            if (currentCallback && typeof currentCallback === 'function') {
              // Use safeCallCallback for consistent error handling like other handlers
              this.safeCallCallback(currentCallback as (data: unknown) => void | Promise<void>, data, 'onCallSignal');
            }
          } catch (error) {
            logger.error('❌ [stompClient] Error parsing call signal:', error);
          }
        }
      );
      this.subscriptions.set('callSignals', callSignalsSub);

    } catch (error) {
      logger.error('❌ Error subscribing to channels:', error);
    }
  }

  /**
   * Subscribe to typing status за конкретен conversation
   */
  subscribeToTyping(conversationId: number, callback: (data: unknown) => void) {
    if (!this.connected || !this.client) {
      return null;
    }

    const destination = `/topic/svmessenger-typing/${conversationId}`;

    const subscription = this.client.subscribe(destination, (message) => {
      try {
        const data = JSON.parse(message.body);
        callback(data);
      } catch (error) {
        logger.error('Error parsing typing status:', error);
      }
    });

    // Store subscription
    const key = `typing-${conversationId}`;
    this.subscriptions.set(key, subscription);

    return subscription;
  }

  /**
   * Unsubscribe от typing status
   */
  unsubscribeFromTyping(conversationId: number) {
    const key = `typing-${conversationId}`;
    const subscription = this.subscriptions.get(key);

    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(key);
    }
  }

  /**
   * Изпрати съобщение през WebSocket
   */
  sendMessage(conversationId: number, text: string, messageType: string = 'TEXT') {
    if (!this.connected || !this.client) {
      return false;
    }

    try {
      this.client.publish({
        destination: '/app/svmessenger/send',
        body: JSON.stringify({
          conversationId,
          text,
          messageType
        })
      });
      return true;
    } catch (error) {
      logger.error('Error sending message:', error);
      return false;
    }
  }

  /**
   * Изпрати typing status
   */
  sendTypingStatus(conversationId: number, isTyping: boolean) {
    if (!this.connected || !this.client) {
      return false;
    }

    try {
      this.client.publish({
        destination: '/app/svmessenger/typing',
        body: JSON.stringify({
          conversationId,
          isTyping
        })
      });
      return true;
    } catch (error) {
      logger.error('Error sending typing status:', error);
      return false;
    }
  }

  /**
   * Маркирай разговор като прочетен през WebSocket
   */
  sendReadReceipt(conversationId: number) {
    if (!this.connected || !this.client) {
      return false;
    }

    try {
      this.client.publish({
        destination: '/app/svmessenger/mark-read',
        body: JSON.stringify({ conversationId })
      });
      return true;
    } catch (error) {
      logger.error('Error sending mark-read via WS:', error);
      return false;
    }
  }

  /**
   * Handle reconnection logic с debouncing
   */
  handleReconnect() {
    // Debouncing: Ако вече има scheduled reconnect, не прави нов
    if (this.reconnectTimeout) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnect attempts reached, giving up');
      return;
    }

    // Ако вече се connect-ва, не прави reconnect
    if (this.isConnecting || this.connected) {
      return;
    }

    this.reconnectAttempts++;

    // Exponential backoff с debouncing
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      30000 // Max delay: 30 seconds
    );

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      
      // Проверка дали все още не е connected преди reconnect
      if (!this.connected && !this.isConnecting) {
        // Trigger reconnect чрез connect() method
        this.connect(this.currentCallbacks || {}).catch((error) => {
          logger.error('Reconnection attempt failed:', error);
        });
      }
    }, delay);
  }

  /**
   * Disconnect от WebSocket
   */
  disconnect() {
    // Cancel any pending reconnection attempts
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.isConnecting = false; // Reset connecting flag
    this.reconnectAttempts = 0; // Reset reconnect attempts
    
    if (this.client) {
      // Unsubscribe от всички channels
      this.subscriptions.forEach(sub => {
        try {
          sub.unsubscribe();
        } catch (e) {
          // Ignore errors during cleanup
        }
      });
      this.subscriptions.clear();

      // Deactivate client
      try {
        if (this.client.connected) {
          this.client.deactivate();
        }
      } catch (e) {
        // Ignore errors during cleanup
      }
      this.client = null;
      this.connected = false;
    }
  }

  /**
   * Check дали е connected
   */
  isConnected() {
    return this.connected;
  }

  /**
   * Check дали се connect-ва в момента
   */
  getIsConnecting(): boolean {
    return this.isConnecting;
  }

  /**
   * Изпрати call signal през WebSocket
   */
  sendCallSignal(signal: CallSignal): boolean {
    if (!this.connected || !this.client) {
      return false;
    }

    try {
      this.client.publish({
        destination: '/app/svmessenger/call-signal',
        body: JSON.stringify(signal)
      });
      return true;
    } catch (error) {
      logger.error('Error sending call signal:', error);
      return false;
    }
  }
}

// Export singleton instance - lazy initialization
let svMobileWebSocketServiceInstance: SVMobileWebSocketService | null = null;

const getWebSocketService = (): SVMobileWebSocketService => {
  if (!svMobileWebSocketServiceInstance) {
    try {
      svMobileWebSocketServiceInstance = new SVMobileWebSocketService();
    } catch (error) {
      logger.error('❌ [WebSocketService] Failed to create instance:', error);
      throw error;
    }
  }
  return svMobileWebSocketServiceInstance;
};

export const svMobileWebSocketService = new Proxy({} as SVMobileWebSocketService, {
  get(target, prop: keyof SVMobileWebSocketService) {
    const instance = getWebSocketService();
    const value = instance[prop];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  }
});

