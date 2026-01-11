/**
 * Authentication Service
 * Handles login, logout, and authentication state
 */

import apiClient from '../api/client';
import { TokenManager } from './tokenManager';
import { API_CONFIG } from '../../config/api';
import { logger } from '../../utils/logger';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: {
    id: number;
    username: string;
    email: string; // Добавено за WebSocket authentication
    fullName: string;
    imageUrl?: string;
    isOnline: boolean;
  };
}

class AuthService {
  private tokenManager: TokenManager | null = null;

  constructor() {
    // Lazy initialization to prevent crashes on module load
  }

  private getTokenManager(): TokenManager {
    if (!this.tokenManager) {
      try {
        this.tokenManager = new TokenManager();
      } catch (error) {
        logger.error('❌ [AuthService] Failed to initialize TokenManager:', error);
        throw error;
      }
    }
    return this.tokenManager;
  }

  /**
   * Валидира email формат
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Валидира login credentials
   */
  private validateCredentials(credentials: LoginCredentials): void {
    if (!credentials.email || !credentials.password) {
      throw new Error('Email и парола са задължителни');
    }

    if (!this.isValidEmail(credentials.email.trim())) {
      throw new Error('Невалиден email формат');
    }

    if (credentials.password.length < 6) {
      throw new Error('Паролата трябва да е поне 6 символа');
    }
  }

  /**
   * Login с email и password
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      // ✅ Валидация на credentials преди изпращане
      this.validateCredentials(credentials);
      
      const response = await apiClient.post<LoginResponse>(
        API_CONFIG.ENDPOINTS.AUTH.LOGIN,
        {
          email: credentials.email.trim().toLowerCase(),
          password: credentials.password,
        }
      );
      
      const { accessToken, refreshToken } = response.data;

      // Запазване на tokens
      await this.getTokenManager().setTokens(accessToken, refreshToken);

      return response.data;
    } catch (error: any) {
      logger.error('❌ [AuthService] Login error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        code: error.code,
      });
      throw new Error(error.response?.data?.error || error.message || 'Login failed');
    }
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      // Извикване на logout endpoint
      await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      logger.error('Logout API error:', error);
      // Продължаваме дори ако API call fail-не
    } finally {
      // Изчистване на tokens
      await this.getTokenManager().clearTokens();
    }
  }

  /**
   * Проверява дали user е authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    return await this.getTokenManager().hasTokens();
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = await this.getTokenManager().getRefreshToken();

      if (!refreshToken) {
        return null;
      }

      const response = await apiClient.post<{
        accessToken: string;
        refreshToken: string;
      }>(API_CONFIG.ENDPOINTS.AUTH.REFRESH, { refreshToken });

      const { accessToken, refreshToken: newRefreshToken } = response.data;

      // Запазване на новите tokens
      await this.getTokenManager().setTokens(accessToken, newRefreshToken);

      return accessToken;
    } catch (error) {
      logger.error('Token refresh error:', error);
      await this.getTokenManager().clearTokens();
      return null;
    }
  }

  /**
   * Get current access token
   */
  async getAccessToken(): Promise<string | null> {
    return await this.getTokenManager().getAccessToken();
  }
}

export const authService = new AuthService();

