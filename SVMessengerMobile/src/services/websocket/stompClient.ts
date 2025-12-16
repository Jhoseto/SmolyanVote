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
  console.log('Creating WebSocket connection to:', url);
  const ws = new WebSocket(url);
  
  // Add error logging
  ws.onerror = (error) => {
    console.error('WebSocket creation error:', error);
    console.error('Failed URL:', url);
  };
  
  ws.onopen = () => {
    console.log('WebSocket opened successfully:', url);
  };
  
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
      this.client = new Client({
        webSocketFactory: () => createWebSocket(wsUrl),
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        reconnectDelay: 10000, // Оптимизирано: 10 секунди вместо 5 (по-малко батерия)
        heartbeatIncoming: 15000, // Оптимизирано: 15 секунди вместо 4 (по-малко батерия)
        heartbeatOutgoing: 15000, // Оптимизирано: 15 секунди вместо 4 (по-малко батерия)
        onConnect: (frame) => {
          console.log('WebSocket connected:', frame);
          this.isConnected = true;
          onConnect?.();
        },
        onStompError: (frame) => {
          console.error('STOMP error:', frame);
          this.isConnected = false;
          onError?.(new Error(frame.headers['message'] || 'STOMP error'));
        },
        onWebSocketError: (event) => {
          console.error('WebSocket error:', event);
          console.error('WebSocket error details:', {
            type: event?.type,
            target: event?.target,
            url: wsUrl,
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
      this.client.activate();
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
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

