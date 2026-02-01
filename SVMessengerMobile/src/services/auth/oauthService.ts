/**
 * OAuth Service
 * Управление на Google и Facebook OAuth login чрез Web Redirect Flow
 * Премахнати са native SDK зависимостите за по-голяма стабилност
 */

import { Linking } from 'react-native';
import apiClient from '../api/client';
import { API_CONFIG } from '../../config/api';
import { TokenManager } from './tokenManager';
import { logger } from '../../utils/logger';

export interface OAuthTokenResponse {
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
    lastSeen?: string;
  };
}

class OAuthService {

  /**
   * Общ метод за OAuth вход чрез Web Browser
   */
  async signInWithProvider(provider: 'google' | 'facebook'): Promise<OAuthTokenResponse> {
    const OAUTH_CALLBACK_TIMEOUT_MS = 5 * 60 * 1000; // 5 min

    return new Promise((resolve, reject) => {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      const cleanup = () => {
        Linking.removeEventListener('url', handleUrl);
        if (timeoutId != null) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      };

      const handleUrl = async ({ url }: { url: string }) => {
        if (!url.startsWith('svmessenger://oauth/callback')) {
          cleanup();
          reject(new Error('OAuth прекъснат или неочакван deep link.'));
          return;
        }
        logger.debug('Deep link received:', url);
        cleanup();

        try {
          const queryString = url.split('?')[1];
          if (!queryString) {
            throw new Error('No parameters received from server');
          }

          const params = queryString.split('&').reduce((acc: Record<string, string>, current) => {
            const [key, value] = current.split('=');
            if (key && value) {
              acc[key] = decodeURIComponent(value);
            }
            return acc;
          }, {});

          const { accessToken, refreshToken } = params;

          if (accessToken && refreshToken) {
            const tokenManager = new TokenManager();
            await tokenManager.setTokens(accessToken, refreshToken);
            const user = await this.fetchUserProfile();
            resolve({
              accessToken,
              refreshToken,
              tokenType: 'Bearer',
              expiresIn: 3600,
              user
            });
          } else {
            throw new Error('Login failed: Token missing in callback');
          }
        } catch (error) {
          logger.error('Error processing OAuth callback:', error);
          reject(error);
        }
      };

      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('Входът изтече. Моля опитайте отново.'));
      }, OAUTH_CALLBACK_TIMEOUT_MS);

      Linking.addEventListener('url', handleUrl);

      const authUrl = `${API_CONFIG.BASE_URL}/api/mobile/auth/start-oauth?provider=${provider}`;
      logger.debug('Opening OAuth URL:', authUrl);

      Linking.openURL(authUrl).catch(err => {
        cleanup();
        logger.error('Failed to open URL:', err);
        reject(new Error('Неуспешно отваряне на браузъра за вход.'));
      });
    });
  }

  /**
   * Google Sign-In
   */
  async signInWithGoogle(): Promise<OAuthTokenResponse> {
    return this.signInWithProvider('google');
  }

  /**
   * Facebook Sign-In
   */
  async signInWithFacebook(): Promise<OAuthTokenResponse> {
    return this.signInWithProvider('facebook');
  }

  /**
   * Взима профила на потребителя след успешен вход
   */
  private async fetchUserProfile(): Promise<any> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.PROFILE.GET);
      return response.data.user;
    } catch (error) {
      logger.error('Failed to fetch user profile:', error);
      throw new Error('Неуспешно извличане на потребителски профил.');
    }
  }

  /**
   * Sign out (Client side only)
   */
  async signOutGoogle(): Promise<void> {
    // Вече няма native SDK, така че просто трием tokens (което се прави от caller-а)
    return Promise.resolve();
  }

  async signOutFacebook(): Promise<void> {
    return Promise.resolve();
  }
}

export const oauthService = new OAuthService();

