/**
 * OAuth Service
 * Управление на Google и Facebook OAuth login
 */

import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import apiClient from '../api/client';
import { API_CONFIG } from '../../config/api';
import { TokenManager } from './tokenManager';
import { logger } from '../../utils/logger';

// Facebook SDK - lazy load only when needed
let FBSDK: any = null;
const loadFacebookSDK = () => {
  if (!FBSDK) {
    try {
      FBSDK = require('react-native-fbsdk-next');
    } catch (error) {
      // Facebook SDK not available - will be handled in signInWithFacebook
    }
  }
  return FBSDK;
};

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
  private isGoogleConfigured = false;

  /**
   * Initialize Google Sign-In
   */
  async initializeGoogleSignIn(): Promise<void> {
    if (this.isGoogleConfigured) {
      return;
    }

    try {
      // Google Web Client ID (used for React Native Google Sign-In)
      // This is the Web application OAuth Client ID
      const webClientId = '362505124214-1db97msqumt6l4rr05sgmd6419o83aru.apps.googleusercontent.com';
      
      // Android OAuth Client ID (for reference - SHA-1 must be added to this in Google Cloud Console)
      // Client ID: 362505124214-au2ebpbu01vq3bbi998d3nlmc5jpk5k1.apps.googleusercontent.com
      // SHA-1: 5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25

      // Изчакваме малко за да се уверим че Activity е готов
      await new Promise(resolve => setTimeout(resolve, 100));

      await GoogleSignin.configure({
        webClientId: webClientId,
        offlineAccess: false, // Changed to false - we only need ID token, not refresh token
        forceCodeForRefreshToken: false, // Changed to false
      });
      
      this.isGoogleConfigured = true;
    } catch (error) {
      logger.error('Error initializing Google Sign-In:', error);
      // Не хвърляме грешка, за да не спре приложението
      // Маркираме като конфигуриран за да не опитваме отново
      this.isGoogleConfigured = true;
    }
  }

  /**
   * Google Sign-In
   */
  async signInWithGoogle(): Promise<OAuthTokenResponse> {
    try {
      // Увери се че Google Sign-In е конфигуриран
      if (!this.isGoogleConfigured) {
        await this.initializeGoogleSignIn();
        
        if (!this.isGoogleConfigured) {
          throw new Error('Google Sign-In не е конфигуриран. Моля, конфигурирайте Google Client ID.');
        }
      }

      // Проверка дали Google Play Services са налични
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Sign in
      const userInfo = await GoogleSignin.signIn();
      
      if (!userInfo.idToken) {
        throw new Error('Google Sign-In failed: No ID token received. Please ensure SHA-1 fingerprint is added to Google Cloud Console Android OAuth Client ID.');
      }

      // Изпращане на token към backend
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
      logger.error('Google Sign-In error details:', {
        code: error.code,
        message: error.message,
        error: error,
      });
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error('Google Sign-In was cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error('Google Sign-In is already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services not available');
      } else if (error.code === statusCodes.DEVELOPER_ERROR) {
        throw new Error('DEVELOPER_ERROR: SHA-1 fingerprint must be added to Google Cloud Console Android OAuth Client ID. SHA-1: 5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25');
      } else {
        throw new Error(error.message || 'Google Sign-In failed');
      }
    }
  }

  /**
   * Facebook Sign-In
   */
  async signInWithFacebook(): Promise<OAuthTokenResponse> {
    try {
      // Lazy load Facebook SDK
      const fbSDK = loadFacebookSDK();
      
      if (!fbSDK || !fbSDK.LoginManager || !fbSDK.AccessToken) {
        throw new Error('Facebook SDK не е наличен. Моля, инсталирайте react-native-fbsdk-next и рестартирайте приложението.');
      }

      const { LoginManager, AccessToken } = fbSDK;

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
      const userInfo = await this.getFacebookUserInfo(data.accessToken, fbSDK);

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
      logger.error('Facebook Sign-In error:', error);
      throw new Error(error.message || 'Facebook Sign-In failed');
    }
  }

  /**
   * Get Facebook user info from Graph API
   */
  private async getFacebookUserInfo(accessToken: string, fbSDK: any): Promise<{
    id: string;
    email: string;
    name: string;
    picture?: { data: { url: string } };
  }> {
    if (!fbSDK || !fbSDK.GraphRequest || !fbSDK.GraphRequestManager) {
      throw new Error('Facebook SDK is not available');
    }

    const { GraphRequest, GraphRequestManager } = fbSDK;

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
        (error: any, result: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
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
      logger.error('Error signing out from Google:', error);
    }
  }

  /**
   * Sign out from Facebook
   */
  async signOutFacebook(): Promise<void> {
    try {
      const fbSDK = loadFacebookSDK();
      if (fbSDK && fbSDK.LoginManager) {
        fbSDK.LoginManager.logOut();
      }
    } catch (error) {
      logger.error('Error signing out from Facebook:', error);
    }
  }
}

export const oauthService = new OAuthService();

