/**
 * API Client Setup
 * Axios instance with interceptors for authentication and error handling
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from '../../config/api';
import { TokenManager } from '../auth/tokenManager';

// Lazy initialization за да избегнем circular dependency
let tokenManagerInstance: TokenManager | null = null;

const getTokenManager = (): TokenManager => {
  if (!tokenManagerInstance) {
    tokenManagerInstance = new TokenManager();
  }
  return tokenManagerInstance;
};

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - добавя access token
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const tokenManager = getTokenManager();
        const token = await tokenManager.getAccessToken();
        
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - обработка на 401 и token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Ако получим 401 и не сме опитали refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const tokenManager = getTokenManager();
            // Опит за refresh на token
            const refreshToken = await tokenManager.getRefreshToken();
            
            if (!refreshToken) {
              // Няма refresh token - redirect към login
              await tokenManager.clearTokens();
              // TODO: Navigate to login screen
              return Promise.reject(error);
            }

            // Refresh token
            const response = await axios.post(
              `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`,
              { refreshToken }
            );

            const { accessToken, refreshToken: newRefreshToken } = response.data;

            // Запазване на новите tokens
            await tokenManager.setTokens(accessToken, newRefreshToken);

            // Retry на оригиналната заявка с новия token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }

            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed - clear tokens и redirect към login
            const tokenManager = getTokenManager();
            await tokenManager.clearTokens();
            // TODO: Navigate to login screen
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  getInstance(): AxiosInstance {
    return this.client;
  }
}

// Singleton instance
export const apiClient = new ApiClient();
export default apiClient.getInstance();

