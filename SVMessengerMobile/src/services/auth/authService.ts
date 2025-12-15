/**
 * Authentication Service
 * Handles login, logout, and authentication state
 */

import apiClient from '../api/client';
import { TokenManager } from './tokenManager';
import { API_CONFIG } from '../../config/api';

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
    fullName: string;
    imageUrl?: string;
    isOnline: boolean;
  };
}

class AuthService {
  private tokenManager: TokenManager;

  constructor() {
    this.tokenManager = new TokenManager();
  }

  /**
   * Login с email и password
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>(
        API_CONFIG.ENDPOINTS.AUTH.LOGIN,
        credentials
      );

      const { accessToken, refreshToken } = response.data;

      // Запазване на tokens
      await this.tokenManager.setTokens(accessToken, refreshToken);

      return response.data;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.error || 'Login failed');
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
      console.error('Logout API error:', error);
      // Продължаваме дори ако API call fail-не
    } finally {
      // Изчистване на tokens
      await this.tokenManager.clearTokens();
    }
  }

  /**
   * Проверява дали user е authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    return await this.tokenManager.hasTokens();
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = await this.tokenManager.getRefreshToken();

      if (!refreshToken) {
        return null;
      }

      const response = await apiClient.post<{
        accessToken: string;
        refreshToken: string;
      }>(API_CONFIG.ENDPOINTS.AUTH.REFRESH, { refreshToken });

      const { accessToken, refreshToken: newRefreshToken } = response.data;

      // Запазване на новите tokens
      await this.tokenManager.setTokens(accessToken, newRefreshToken);

      return accessToken;
    } catch (error) {
      console.error('Token refresh error:', error);
      await this.tokenManager.clearTokens();
      return null;
    }
  }

  /**
   * Get current access token
   */
  async getAccessToken(): Promise<string | null> {
    return await this.tokenManager.getAccessToken();
  }
}

export const authService = new AuthService();

