/**
 * SVMessenger WebSocket Service за React Native
 * Използва custom SockJS implementation за съвместимост с backend
 */

import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_CONFIG } from '../../config/api';
import { TokenManager } from '../auth/tokenManager';

class SVMobileWebSocketService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.subscriptions = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.isConnecting = false; // Защита срещу множествени извиквания на connect
    this.tokenManager = new TokenManager();
  }

  /**
   * Connect към WebSocket server
   */
  async connect(callbacks = {}) {
    // Защита срещу множествени извиквания - ако вече се connect-ва, не прави нищо
    if (this.isConnecting || (this.client && this.client.connected)) {
      console.log('⚠️ WebSocket already connecting or connected, skipping duplicate connect call');
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
      console.log('⚠️ Disconnecting existing WebSocket client before creating new one');
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
        console.warn('Error disconnecting old client:', error);
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

      console.log('🔐 WebSocket token available, connecting...');

      // Create plain WebSocket connection URL with token
      const wsUrl = API_CONFIG.WS_URL;
      console.log('🔌 Connecting to plain WebSocket endpoint:', wsUrl);

      // Create STOMP client with SockJS (standard approach за React Native + Spring Boot)
      this.client = new Client({
        webSocketFactory: () => new SockJS(wsUrl),

        // STOMP connect headers с JWT token
        connectHeaders: {
          'Authorization': `Bearer ${token}`
        },

        // Debug logging само в development
        debug: (str) => {
          if (__DEV__) {
            console.log('🔍 STOMP debug:', str);
          }
        },

        // Reconnect settings
        reconnectDelay: this.reconnectDelay,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,

        // Connection success callback
        onConnect: () => {
          // Защита срещу множествени извиквания на onConnect
          if (this.connected) {
            console.log('⚠️ onConnect called but already connected, skipping duplicate subscription');
            return;
          }

          this.connected = true;
          this.isConnecting = false; // Reset connecting flag
          this.reconnectAttempts = 0;

          console.log('✅ WebSocket STOMP connected, subscribing to channels...');

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
          console.error('❌ STOMP connection error:', frame);
          this.connected = false;
          this.isConnecting = false; // Reset connecting flag
          onError(frame);

          // Retry connection
          this.handleReconnect();
        },

        // WebSocket close callback
        onWebSocketClose: () => {
          console.log('⚠️ WebSocket connection closed');
          this.connected = false;
          this.isConnecting = false; // Reset connecting flag
          onDisconnect();

          // Retry connection
          this.handleReconnect();
        }
      });

      // Activate connection
      console.log('🚀 Activating STOMP client...');
      this.client.activate();

    } catch (error) {
      console.error('❌ Error setting up WebSocket connection:', error);
      this.connected = false;
      this.isConnecting = false;
      onError(error);
    }
  }

  /**
   * Subscribe to WebSocket channels
   */
  subscribeToChannels(callbacks) {
    const { onNewMessage, onTypingStatus, onReadReceipt, onDeliveryReceipt, onOnlineStatus, onCallSignal } = callbacks;

    // Премахни старите subscriptions преди да създадеш нови
    const coreSubscriptionKeys = ['messages', 'receipts', 'delivery', 'status', 'callSignals'];
    coreSubscriptionKeys.forEach(key => {
      const oldSub = this.subscriptions.get(key);
      if (oldSub) {
        try {
          oldSub.unsubscribe();
        } catch (error) {
          console.warn('Error unsubscribing old subscription:', key, error);
        }
        this.subscriptions.delete(key);
      }
    });

    try {
      // 1. Private messages channel
      const messagesSub = this.client.subscribe(
        '/user/queue/svmessenger-messages',
        (message) => {
          try {
            const data = JSON.parse(message.body);
            onNewMessage(data);
          } catch (error) {
            console.error('Error parsing message:', error);
          }
        }
      );
      this.subscriptions.set('messages', messagesSub);

      // 2. Read receipts channel
      const receiptsSub = this.client.subscribe(
        '/user/queue/svmessenger-read-receipts',
        (message) => {
          try {
            const data = JSON.parse(message.body);
            onReadReceipt(data);
          } catch (error) {
            console.error('Error parsing receipt:', error);
          }
        }
      );
      this.subscriptions.set('receipts', receiptsSub);

      // 3. Delivery receipts channel
      const deliverySub = this.client.subscribe(
        '/user/queue/svmessenger-delivery-receipts',
        (message) => {
          try {
            const data = JSON.parse(message.body);
            onDeliveryReceipt(data);
          } catch (error) {
            console.error('Error parsing delivery receipt:', error);
          }
        }
      );
      this.subscriptions.set('delivery', deliverySub);

      // 4. Online status channel
      const statusSub = this.client.subscribe(
        '/topic/svmessenger-online-status',
        (message) => {
          try {
            const data = JSON.parse(message.body);
            onOnlineStatus(data);
          } catch (error) {
            console.error('Error parsing status:', error);
          }
        }
      );
      this.subscriptions.set('status', statusSub);

      // 5. Call signals channel
      const callSignalsSub = this.client.subscribe(
        '/user/queue/svmessenger-call-signals',
        (message) => {
          try {
            console.log('📞 [stompClient] Raw call signal received:', message.body);
            const data = JSON.parse(message.body);
            console.log('📞 [stompClient] Parsed call signal:', data);
            console.log('📞 [stompClient] onCallSignal type:', typeof onCallSignal, 'is function:', typeof onCallSignal === 'function');
            
            if (onCallSignal && typeof onCallSignal === 'function') {
              console.log('📞 [stompClient] Calling onCallSignal with data:', data);
              onCallSignal(data);
              console.log('📞 [stompClient] onCallSignal executed');
            } else {
              console.error('❌ [stompClient] onCallSignal is not a function:', typeof onCallSignal);
            }
          } catch (error) {
            console.error('❌ [stompClient] Error parsing call signal:', error);
          }
        }
      );
      this.subscriptions.set('callSignals', callSignalsSub);

      console.log('✅ All WebSocket channels subscribed successfully');

    } catch (error) {
      console.error('❌ Error subscribing to channels:', error);
    }
  }

  /**
   * Subscribe to typing status за конкретен conversation
   */
  subscribeToTyping(conversationId, callback) {
    if (!this.connected || !this.client) {
      console.warn('Cannot subscribe to typing - not connected');
      return null;
    }

    const destination = `/topic/svmessenger-typing/${conversationId}`;

    const subscription = this.client.subscribe(destination, (message) => {
      try {
        const data = JSON.parse(message.body);
        callback(data);
      } catch (error) {
        console.error('Error parsing typing status:', error);
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
  unsubscribeFromTyping(conversationId) {
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
  sendMessage(conversationId, text, messageType = 'TEXT') {
    if (!this.connected || !this.client) {
      console.warn('Cannot send message - not connected');
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
      console.error('Error sending message:', error);
      return false;
    }
  }

  /**
   * Изпрати typing status
   */
  sendTypingStatus(conversationId, isTyping) {
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
      console.error('Error sending typing status:', error);
      return false;
    }
  }

  /**
   * Маркирай разговор като прочетен през WebSocket
   */
  sendReadReceipt(conversationId) {
    if (!this.connected || !this.client) {
      console.warn('Cannot send mark-read - not connected');
      return false;
    }

    try {
      this.client.publish({
        destination: '/app/svmessenger/mark-read',
        body: JSON.stringify({ conversationId })
      });
      return true;
    } catch (error) {
      console.error('Error sending mark-read via WS:', error);
      return false;
    }
  }

  /**
   * Handle reconnection logic
   */
  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached, giving up');
      return;
    }

    this.reconnectAttempts++;

    // Exponential backoff
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`🔄 Scheduling WebSocket reconnection in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      console.log(`🔄 Attempting WebSocket reconnection (attempt ${this.reconnectAttempts})`);
      // The client will auto-reconnect, but we can trigger a manual reconnect if needed
    }, delay);
  }

  /**
   * Disconnect от WebSocket
   */
  disconnect() {
    this.isConnecting = false; // Reset connecting flag
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
   * Изпрати call signal през WebSocket
   */
  sendCallSignal(signal) {
    if (!this.connected || !this.client) {
      console.warn('Cannot send call signal - not connected');
      return false;
    }

    try {
      this.client.publish({
        destination: '/app/svmessenger/call-signal',
        body: JSON.stringify(signal)
      });
      return true;
    } catch (error) {
      console.error('Error sending call signal:', error);
      return false;
    }
  }
}

// Export singleton instance
export const svMobileWebSocketService = new SVMobileWebSocketService();

