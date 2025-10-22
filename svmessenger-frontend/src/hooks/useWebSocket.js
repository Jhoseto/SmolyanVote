import { useEffect, useRef, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

/**
 * Custom hook за WebSocket връзка с Spring Boot STOMP
 */
export function useWebSocket({ onMessage, onError }) {
  const stompClientRef = useRef(null);
  const isConnectedRef = useRef(false);
  
  // Connect to WebSocket
  const connect = useCallback(() => {
    if (isConnectedRef.current) return;
    
    try {
      // Create SockJS connection
      const socket = new SockJS('/ws-svmessenger/websocket');
      
      // Create STOMP client
      const stompClient = new Stomp({
        webSocketFactory: () => socket,
        debug: (str) => {
          console.log('STOMP Debug:', str);
        },
        onConnect: (frame) => {
          console.log('Connected to SVMessenger WebSocket');
          isConnectedRef.current = true;
          
          // Subscribe to user-specific queue
          const userId = window.SVMESSENGER_USER_DATA?.id;
          if (userId) {
            stompClient.subscribe(`/user/${userId}/queue/svmessenger`, (message) => {
              try {
                const data = JSON.parse(message.body);
                onMessage(data);
              } catch (error) {
                console.error('Error parsing WebSocket message:', error);
              }
            });
          }
        },
        onStompError: (error) => {
          console.error('STOMP Error:', error);
          isConnectedRef.current = false;
          onError(error);
        },
        onWebSocketClose: () => {
          console.log('WebSocket connection closed');
          isConnectedRef.current = false;
        }
      });
      
      // Activate STOMP client
      stompClient.activate();
      stompClientRef.current = stompClient;
      
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      onError(error);
    }
  }, [onMessage, onError]);
  
  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (stompClientRef.current && isConnectedRef.current) {
      stompClientRef.current.deactivate();
      isConnectedRef.current = false;
    }
  }, []);
  
  // Send message via WebSocket
  const sendMessage = useCallback((message) => {
    if (stompClientRef.current && isConnectedRef.current) {
      stompClientRef.current.publish({
        destination: '/app/svmessenger/send',
        body: JSON.stringify(message)
      });
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }, []);
  
  // Auto-connect on mount
  useEffect(() => {
    connect();
    
    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);
  
  // Reconnect on visibility change (when user comes back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isConnectedRef.current) {
        connect();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connect]);
  
  return {
    isConnected: isConnectedRef.current,
    sendMessage,
    connect,
    disconnect
  };
}
