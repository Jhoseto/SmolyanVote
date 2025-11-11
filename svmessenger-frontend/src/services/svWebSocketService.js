/**
 * WebSocket Service за SVMessenger
 * Използва SockJS + STOMP за real-time комуникация
 */

import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

class SVWebSocketService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.subscriptions = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
  }
  
  /**
   * Connect към WebSocket server
   */
  connect(callbacks = {}) {
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
    
    // Create SockJS instance
    const socket = new SockJS('/ws-svmessenger');
    
    // Create STOMP client
    this.client = new Client({
      webSocketFactory: () => socket,
      
      // Disable debug logging в production
      debug: (str) => {
        if (process.env.NODE_ENV === 'development') {
        }
      },
      
      // Reconnect settings
      reconnectDelay: this.reconnectDelay,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      
      // Connection success callback
      onConnect: () => {
        this.connected = true;
        this.reconnectAttempts = 0;


        // Subscribe to channels
        this.subscribeToChannels({
          onNewMessage,
          onTypingStatus,
          onReadReceipt,
          onDeliveryReceipt,
          onOnlineStatus
        });

        onConnect();
      },
      
      // Connection error callback
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
        this.connected = false;
        onError(frame);
        
        // Retry connection
        this.handleReconnect();
      },
      
      // WebSocket close callback
      onWebSocketClose: () => {
        this.connected = false;
        onDisconnect();
        
        // Retry connection
        this.handleReconnect();
      }
    });
    
    // Activate connection
    this.client.activate();
  }
  
  /**
   * Subscribe to WebSocket channels
   */
  subscribeToChannels(callbacks) {
    const { onNewMessage, onTypingStatus, onReadReceipt, onDeliveryReceipt, onOnlineStatus, onCallSignal } = callbacks;
    
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
          const data = JSON.parse(message.body);
          onCallSignal(data);
        } catch (error) {
          console.error('Error parsing call signal:', error);
        }
      }
    );
    this.subscriptions.set('callSignals', callSignalsSub);
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
  sendMessage(conversationId, text) {
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
          messageType: 'TEXT'
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
   * Маркирай разговор като прочетен през WebSocket (по-бързо от REST)
   */
  sendRead(conversationId) {
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
      console.error('Max reconnect attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    
    // Client auto-reconnects, но можем да добавим custom logic
  }
  
  /**
   * Disconnect от WebSocket
   */
  disconnect() {
    if (this.client) {
      // Unsubscribe от всички channels
      this.subscriptions.forEach(sub => sub.unsubscribe());
      this.subscriptions.clear();
      
      // Deactivate client
      this.client.deactivate();
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
export default new SVWebSocketService();
