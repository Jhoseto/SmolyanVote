/**
 * STOMP WebSocket Client
 * Connection management за real-time messaging
 */

import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { API_CONFIG } from '../../config/api';
import { TokenManager } from '../auth/tokenManager';

// WebSocket factory за React Native
// В React Native използваме native WebSocket вместо SockJS
// SockJS endpoint: /ws-svmessenger -> WebSocket: ws://host/ws-svmessenger/websocket
const createWebSocket = (url: string): WebSocket => {
  // SockJS автоматично добавя /websocket към URL-а
  // За React Native трябва да го добавим ръчно
  let wsUrl = url;
  if (!wsUrl.endsWith('/websocket')) {
    wsUrl = wsUrl.endsWith('/') ? `${wsUrl}websocket` : `${wsUrl}/websocket`;
  }
  return new WebSocket(wsUrl);
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
      // В production може да се използва react-native-websocket или native WebSocket
      const wsUrl = API_CONFIG.WS_URL.replace('ws://', 'ws://').replace('wss://', 'wss://');
      
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
          this.isConnected = false;
          onError?.(new Error('WebSocket connection error'));
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
    if (this.client) {
      // Unsubscribe от всички subscriptions
      this.subscriptions.forEach((subscription) => {
        subscription.unsubscribe();
      });
      this.subscriptions.clear();

      // Deactivate client
      this.client.deactivate();
      this.client = null;
      this.isConnected = false;
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

