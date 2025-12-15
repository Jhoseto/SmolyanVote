/**
 * OAuth Service
 * Управление на Google и Facebook OAuth login
 */

import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken, GraphRequest, GraphRequestManager } from 'react-native-fbsdk-next';
import apiClient from '../api/client';
import { API_CONFIG } from '../../config/api';
import { TokenManager } from './tokenManager';

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
  };
}

class OAuthService {
  /**
   * Initialize Google Sign-In
   */
  async initializeGoogleSignIn(): Promise<void> {
    try {
      // Google Client ID трябва да се конфигурира в AndroidManifest.xml и Info.plist
      // За сега използваме placeholder - трябва да се замени с реален Client ID
      await GoogleSignin.configure({
        webClientId: 'YOUR_GOOGLE_WEB_CLIENT_ID', // Трябва да се замени с реален Client ID
        offlineAccess: true,
        forceCodeForRefreshToken: true,
      });
    } catch (error) {
      console.error('Error initializing Google Sign-In:', error);
      throw error;
    }
  }

  /**
   * Google Sign-In
   */
  async signInWithGoogle(): Promise<OAuthTokenResponse> {
    try {
      // Проверка дали Google Play Services са налични
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Sign in
      const userInfo = await GoogleSignin.signIn();
      
      if (!userInfo.idToken) {
        throw new Error('Google Sign-In failed: No ID token received');
      }

      // Изпращане на token към backend
      // За mobile използваме idToken вместо serverAuthCode
      const response = await apiClient.post<OAuthTokenResponse>(
        API_CONFIG.ENDPOINTS.AUTH.OAUTH,
        {
          provider: 'google',
          idToken: userInfo.idToken,
        }
      );

      // Запазване на tokens
      const tokenManager = new TokenManager();
      await tokenManager.setTokens(response.data.accessToken, response.data.refreshToken);

      return response.data;
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error('Google Sign-In was cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error('Google Sign-In is already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services not available');
      } else {
        console.error('Google Sign-In error:', error);
        throw new Error(error.message || 'Google Sign-In failed');
      }
    }
  }

  /**
   * Facebook Sign-In
   */
  async signInWithFacebook(): Promise<OAuthTokenResponse> {
    try {
      // Login with Facebook
      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);

      if (result.isCancelled) {
        throw new Error('Facebook login was cancelled');
      }

      // Get access token
      const data = await AccessToken.getCurrentAccessToken();
      
      if (!data) {
        throw new Error('Facebook login failed: No access token received');
      }

      // Get user info from Facebook Graph API
      const userInfo = await this.getFacebookUserInfo(data.accessToken);

      // Изпращане на token към backend
      const response = await apiClient.post<OAuthTokenResponse>(
        API_CONFIG.ENDPOINTS.AUTH.OAUTH,
        {
          provider: 'facebook',
          accessToken: data.accessToken,
        }
      );

      // Запазване на tokens
      const tokenManager = new TokenManager();
      await tokenManager.setTokens(response.data.accessToken, response.data.refreshToken);

      return response.data;
    } catch (error: any) {
      console.error('Facebook Sign-In error:', error);
      throw new Error(error.message || 'Facebook Sign-In failed');
    }
  }

  /**
   * Get Facebook user info from Graph API
   */
  private async getFacebookUserInfo(accessToken: string): Promise<{
    id: string;
    email: string;
    name: string;
    picture?: { data: { url: string } };
  }> {
    return new Promise((resolve, reject) => {
      const infoRequest = new GraphRequest(
        '/me',
        {
          parameters: {
            fields: {
              string: 'id,name,email,picture.type(large)',
            },
            access_token: {
              string: accessToken,
            },
          },
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result as any);
          }
        }
      );

      new GraphRequestManager().addRequest(infoRequest).start();
    });
  }

  /**
   * Sign out from Google
   */
  async signOutGoogle(): Promise<void> {
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.error('Error signing out from Google:', error);
    }
  }

  /**
   * Sign out from Facebook
   */
  async signOutFacebook(): Promise<void> {
    try {
      LoginManager.logOut();
    } catch (error) {
      console.error('Error signing out from Facebook:', error);
    }
  }
}

export const oauthService = new OAuthService();

