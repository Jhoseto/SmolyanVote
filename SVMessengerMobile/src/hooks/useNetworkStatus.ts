/**
 * useNetworkStatus Hook
 * Мониторира network статуса
 */

import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useUIStore } from '../store/uiStore';

export const useNetworkStatus = () => {
  const { setNetworkStatus } = useUIStore();

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    try {
      // Subscribe to network state changes
      unsubscribe = NetInfo.addEventListener((state) => {
        try {
          const isConnected = state.isConnected && state.isInternetReachable;
          setNetworkStatus(isConnected ? 'online' : 'offline');
        } catch (error) {
          console.error('Error in network status listener:', error);
        }
      });

      // Get initial network state
      NetInfo.fetch().then((state) => {
        try {
          const isConnected = state.isConnected && state.isInternetReachable;
          setNetworkStatus(isConnected ? 'online' : 'offline');
        } catch (error) {
          console.error('Error fetching initial network state:', error);
        }
      }).catch((error) => {
        console.error('Error fetching network state:', error);
      });
    } catch (error) {
      console.error('Error initializing network status:', error);
    }

    return () => {
      try {
        if (unsubscribe) {
          unsubscribe();
        }
      } catch (error) {
        console.error('Error cleaning up network status:', error);
      }
    };
  }, [setNetworkStatus]);
};

