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
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = state.isConnected && state.isInternetReachable;
      setNetworkStatus(isConnected ? 'online' : 'offline');
    });

    // Get initial network state
    NetInfo.fetch().then((state) => {
      const isConnected = state.isConnected && state.isInternetReachable;
      setNetworkStatus(isConnected ? 'online' : 'offline');
    });

    return () => {
      unsubscribe();
    };
  }, [setNetworkStatus]);
};

