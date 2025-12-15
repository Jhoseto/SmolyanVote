/**
 * UI Store (Zustand)
 * Управление на UI state (loading, modals, etc.)
 */

import { create } from 'zustand';

interface UIState {
  isLoading: boolean;
  loadingMessage: string | null;
  activeModal: string | null;
  networkStatus: 'online' | 'offline' | 'unknown';
  theme: 'light' | 'dark';
}

interface UIStore extends UIState {
  // Actions
  setLoading: (isLoading: boolean, message?: string) => void;
  showModal: (modalName: string) => void;
  hideModal: () => void;
  setNetworkStatus: (status: 'online' | 'offline' | 'unknown') => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIStore>((set) => ({
  // Initial state
  isLoading: false,
  loadingMessage: null,
  activeModal: null,
  networkStatus: 'unknown',
  theme: 'light',

  // Set loading state
  setLoading: (isLoading: boolean, message?: string) => {
    set({
      isLoading,
      loadingMessage: message || null,
    });
  },

  // Show modal
  showModal: (modalName: string) => {
    set({ activeModal: modalName });
  },

  // Hide modal
  hideModal: () => {
    set({ activeModal: null });
  },

  // Set network status
  setNetworkStatus: (status: 'online' | 'offline' | 'unknown') => {
    set({ networkStatus: status });
  },

  // Set theme
  setTheme: (theme: 'light' | 'dark') => {
    set({ theme });
  },
}));

