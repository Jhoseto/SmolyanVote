/**
 * UI Store (Zustand)
 * Управление на UI state (loading, modals, etc.)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UIState {
  isLoading: boolean;
  loadingMessage: string | null;
  activeModal: string | null;
  networkStatus: 'online' | 'offline' | 'unknown';
  theme: 'light' | 'dark';
  language: string;
}

interface UIStore extends UIState {
  // Actions
  setLoading: (isLoading: boolean, message?: string) => void;
  showModal: (modalName: string) => void;
  hideModal: () => void;
  setNetworkStatus: (status: 'online' | 'offline' | 'unknown') => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (lang: string) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      // Initial state
      isLoading: false,
      loadingMessage: null,
      activeModal: null,
      networkStatus: 'unknown',
      theme: 'light',
      language: 'bg',

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

      // Set language
      setLanguage: (lang: string) => {
        set({ language: lang });
      },
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
      }),
    }
  )
);

