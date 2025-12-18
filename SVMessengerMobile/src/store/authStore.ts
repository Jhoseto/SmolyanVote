/**
 * Auth Store (Zustand)
 * Управление на authentication state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, User, LoginResponse } from '../types/auth';
import { authService } from '../services/auth/authService';

interface AuthStore extends AuthState {
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login action
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response: LoginResponse = await authService.login({ email, password });
          
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Login failed',
            isAuthenticated: false,
            user: null,
          });
          throw error;
        }
      },

      // Logout action
      logout: async () => {
        set({ isLoading: true });
        try {
          // Disconnect WebSocket преди logout
          try {
            const { svMobileWebSocketService } = require('../services/websocket/stompClient');
            if (svMobileWebSocketService.isConnected()) {
              svMobileWebSocketService.disconnect();
            }
          } catch (error) {
            console.error('Error disconnecting WebSocket on logout:', error);
          }

          await authService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      // Refresh auth (check if still authenticated)
      refreshAuth: async () => {
        try {
          const hasTokens = await authService.isAuthenticated();
          if (!hasTokens) {
            set({ isAuthenticated: false, user: null });
            return;
          }

          // Token съществува - считаме че сме authenticated
          // Ако token е изтекъл, API interceptor ще се опита да го refresh-не при следващата заявка
          // Не правим API call тук, за да избегнем излишни заявки
          // Не override-ваме user - той вече е възстановен от persist state
          set({ isAuthenticated: true });
        } catch (error) {
          console.error('Error refreshing auth:', error);
          set({ isAuthenticated: false, user: null });
        }
      },

      // Set user manually
      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

