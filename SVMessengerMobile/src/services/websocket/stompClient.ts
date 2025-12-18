/**
 * STOMP WebSocket Client
 * Connection management за real-time messaging
 */

import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { API_CONFIG } from '../../config/api';
import { TokenManager } from '../auth/tokenManager';

// WebSocket factory за React Native
// В React Native използваме native WebSocket
// Backend използва обикновен WebSocket, не SockJS, така че не добавяме /websocket
const createWebSocket = (url: string): WebSocket => {
  console.log('🔌 Creating WebSocket connection to:', url);
  const ws = new WebSocket(url);
  
  // Add comprehensive error logging
  ws.onerror = (error) => {
    console.error('❌ WebSocket creation error:', error);
    console.error('❌ Failed URL:', url);
    console.error('❌ WebSocket readyState:', ws.readyState);
    // WebSocket readyState: 0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED
  };
  
  ws.onopen = () => {
    console.log('✅ WebSocket opened successfully:', url);
    console.log('✅ WebSocket readyState:', ws.readyState);
  };
  
  ws.onclose = (event) => {
    console.log('⚠️ WebSocket closed:', {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean,
      url: url,
    });
  };
  
  // Log connection state after a short delay
  setTimeout(() => {
    console.log('🔍 WebSocket state check after 1s:', {
      readyState: ws.readyState,
      url: url,
      state: ws.readyState === 0 ? 'CONNECTING' : 
             ws.readyState === 1 ? 'OPEN' : 
             ws.readyState === 2 ? 'CLOSING' : 'CLOSED'
    });
  }, 1000);
  
  return ws;
};

export type MessageCallback = (message: any) => void;
export type ErrorCallback = (error: Error) => void;
export type ConnectionCallback = () => void;

class StompClient {
  private client: Client | null = null;
  private tokenManager: TokenManager;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private isConnected: boolean = false;

  constructor() {
    this.tokenManager = new TokenManager();
  }

  /**
   * Connect към WebSocket server
   */
  async connect(
    onConnect?: ConnectionCallback,
    onError?: ErrorCallback
  ): Promise<void> {
    if (this.isConnected && this.client?.connected) {
      console.log('Already connected to WebSocket');
      return;
    }

    try {
      // Извличане на access token
      const token = await this.tokenManager.getAccessToken();

      if (!token) {
        throw new Error('No access token available');
      }

      // Създаване на WebSocket connection за React Native
      const wsUrl = API_CONFIG.WS_URL;
      console.log('Connecting to WebSocket:', wsUrl);
      console.log('Access token available:', !!token);
      
      // Създаване на STOMP client
      const connectHeaders = {
        Authorization: `Bearer ${token}`,
      };
      console.log('🔐 WebSocket connect headers:', {
        hasAuth: !!connectHeaders.Authorization,
        authLength: connectHeaders.Authorization?.length || 0,
        tokenPrefix: connectHeaders.Authorization?.substring(0, 20) || 'none',
      });
      
      this.client = new Client({
        webSocketFactory: () => {
          console.log('🔌 STOMP Client requesting WebSocket connection to:', wsUrl);
          const ws = createWebSocket(wsUrl);
          console.log('🔌 WebSocket instance created, readyState:', ws.readyState);
          return ws;
        },
        connectHeaders,
        reconnectDelay: 10000, // Оптимизирано: 10 секунди вместо 5 (по-малко батерия)
        heartbeatIncoming: 15000, // Оптимизирано: 15 секунди вместо 4 (по-малко батерия)
        heartbeatOutgoing: 15000, // Оптимизирано: 15 секунди вместо 4 (по-малко батерия)
        // Debug logging за STOMP
        debug: (str) => {
          console.log('🔍 STOMP debug:', str);
        },
        onConnect: (frame) => {
          console.log('✅✅✅ WebSocket STOMP connected successfully ✅✅✅');
          console.log('✅ STOMP frame headers:', frame.headers);
          console.log('✅ STOMP frame command:', frame.command);
          console.log('✅ Backend will automatically update online status in database');
          this.isConnected = true;
          onConnect?.();
        },
        onStompError: (frame) => {
          console.error('❌ STOMP error:', frame);
          console.error('❌ STOMP error headers:', frame.headers);
          console.error('❌ STOMP error body:', frame.body);
          this.isConnected = false;
          const errorMessage = frame.headers['message'] || frame.body || 'STOMP error';
          onError?.(new Error(`STOMP error: ${errorMessage}`));
        },
        onWebSocketError: (event) => {
          console.error('❌ WebSocket error:', event);
          console.error('❌ WebSocket error details:', {
            type: event?.type,
            target: event?.target,
            url: wsUrl,
            message: event?.message,
          });
          this.isConnected = false;
          const errorMessage = event?.message || 'WebSocket connection error';
          onError?.(new Error(`WebSocket error: ${errorMessage}. URL: ${wsUrl}`));
        },
        onDisconnect: () => {
          console.log('WebSocket disconnected');
          this.isConnected = false;
        },
      });

      // Activate client
      console.log('🚀 Activating STOMP client...');
      this.client.activate();
      console.log('🚀 STOMP client activation called, waiting for connection...');
      
      // Check connection status after a delay
      setTimeout(() => {
        if (this.client) {
          console.log('🔍 STOMP client status check after 2s:', {
            connected: this.client.connected,
            active: this.client.active,
            isConnected: this.isConnected,
          });
          if (!this.client.connected && !this.isConnected) {
            console.warn('⚠️ STOMP client not connected after 2 seconds - connection may have failed');
            console.warn('⚠️ Check backend logs for JWT authentication errors');
          }
        }
      }, 2000);
    } catch (error) {
      console.error('❌ Error connecting to WebSocket:', error);
      console.error('❌ Error details:', {
        message: (error as Error)?.message,
        stack: (error as Error)?.stack,
      });
      this.isConnected = false;
      onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Disconnect от WebSocket server
   */
  disconnect(): void {
    try {
      if (this.client) {
        // Unsubscribe от всички subscriptions
        this.subscriptions.forEach((subscription) => {
          try {
            subscription.unsubscribe();
          } catch (error) {
            console.error('Error unsubscribing:', error);
          }
        });
        this.subscriptions.clear();

        // Deactivate client
        try {
          this.client.deactivate();
        } catch (error) {
          console.error('Error deactivating client:', error);
        }
        this.client = null;
        this.isConnected = false;
      }
    } catch (error) {
      console.error('Error disconnecting WebSocket:', error);
      // Ensure state is reset even if disconnect fails
      this.client = null;
      this.isConnected = false;
      this.subscriptions.clear();
    }
  }

  /**
   * Subscribe към destination
   */
  subscribe(
    destination: string,
    callback: MessageCallback
  ): StompSubscription | null {
    if (!this.client || !this.client.connected) {
      console.error('WebSocket not connected');
      return null;
    }

    try {
      const subscription = this.client.subscribe(destination, (message: IMessage) => {
        try {
          const data = JSON.parse(message.body);
          callback(data);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });

      this.subscriptions.set(destination, subscription);
      return subscription;
    } catch (error) {
      console.error('Error subscribing:', error);
      return null;
    }
  }

  /**
   * Unsubscribe от destination
   */
  unsubscribe(destination: string): void {
    const subscription = this.subscriptions.get(destination);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(destination);
    }
  }

  /**
   * Send message към destination
   */
  send(destination: string, body: any): void {
    if (!this.client || !this.client.connected) {
      console.error('WebSocket not connected');
      return;
    }

    try {
      this.client.publish({
        destination,
        body: JSON.stringify(body),
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  /**
   * Проверява дали е connected
   */
  getConnected(): boolean {
    return this.isConnected && (this.client?.connected ?? false);
  }

  /**
   * Reconnect с нов token (при token refresh)
   */
  async reconnect(): Promise<void> {
    this.disconnect();
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
    await this.connect();
  }
}

export const stompClient = new StompClient();

