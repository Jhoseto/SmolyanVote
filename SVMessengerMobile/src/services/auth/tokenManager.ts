/**
 * Token Manager
 * Secure storage and management of JWT tokens
 */

import * as Keychain from 'react-native-keychain';
import EncryptedStorage from 'react-native-encrypted-storage';

const ACCESS_TOKEN_KEY = 'svmessenger_access_token';
const REFRESH_TOKEN_KEY = 'svmessenger_refresh_token';

export class TokenManager {
  /**
   * Запазва access и refresh tokens
   */
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      // Access token в Keychain (най-сигурно)
      await Keychain.setGenericPassword(ACCESS_TOKEN_KEY, accessToken, {
        service: ACCESS_TOKEN_KEY,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });

      // Refresh token в EncryptedStorage
      await EncryptedStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } catch (error) {
      console.error('Error saving tokens:', error);
      throw error;
    }
  }

  /**
   * Извлича access token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: ACCESS_TOKEN_KEY,
      });

      if (credentials && credentials.password) {
        return credentials.password;
      }

      return null;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Извлича refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      const token = await EncryptedStorage.getItem(REFRESH_TOKEN_KEY);
      return token;
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  /**
   * Изчиства всички tokens
   */
  async clearTokens(): Promise<void> {
    try {
      await Keychain.resetGenericPassword({ service: ACCESS_TOKEN_KEY });
      await EncryptedStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  /**
   * Проверява дали има запазени tokens
   */
  async hasTokens(): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();
      const refreshToken = await this.getRefreshToken();
      return !!(accessToken && refreshToken);
    } catch (error) {
      console.error('Error checking tokens:', error);
      return false;
    }
  }
}

