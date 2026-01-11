/**
 * API Client Setup
 * Axios instance with interceptors for authentication and error handling
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from '../../config/api';
import { TokenManager } from '../auth/tokenManager';
import { logger } from '../../utils/logger';

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
  private isRefreshing: boolean = false; // Rate limiting за token refresh
  private refreshPromise: Promise<string | null> | null = null; // Shared promise за множествени refresh attempts

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
        
        // За FormData не задаваме Content-Type - Axios ще го зададе автоматично
        if (config.data instanceof FormData && config.headers) {
          delete config.headers['Content-Type'];
        }
        
        if (!config.url) {
          logger.error('❌ [ApiClient] CRITICAL: Request URL is undefined!', {
            method: config.method,
            baseURL: config.baseURL,
            data: config.data,
            stack: new Error().stack,
          });
        }
        
        return config;
      },
      (error: AxiosError) => {
        logger.error('❌ [ApiClient] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - обработка на 401 и token refresh
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error: AxiosError) => {
        logger.error(`❌ [ApiClient] ${error.config?.method?.toUpperCase()} ${error.config?.url} - Error:`, {
          status: error.response?.status,
          statusText: error.response?.statusText,
          message: error.message,
          code: error.code,
        });
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Ако получим 401 или 405 (вероятно изтекъл token) и не сме опитали refresh
        // НЕ правим token refresh за /heartbeat endpoint - той не е критичен и WebSocket поддържа online статус
        const isHeartbeat = originalRequest?.url === '/heartbeat' || originalRequest?.url?.endsWith('/heartbeat');
        const isAuthError = error.response?.status === 401 || error.response?.status === 405;
        if (isAuthError && !originalRequest._retry && originalRequest && originalRequest.url && !isHeartbeat) {
          originalRequest._retry = true;

          // Rate limiting: Ако вече се refresh-ва token, изчакай същия promise
          if (this.isRefreshing && this.refreshPromise) {
            try {
              const accessToken = await this.refreshPromise;
              if (accessToken && originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              }
              return this.client(originalRequest);
            } catch (refreshError) {
              // ✅ FIX: Reset flags if refresh promise rejects to prevent permanent lock
              // This ensures subsequent requests can retry refresh instead of waiting forever
              this.isRefreshing = false;
              this.refreshPromise = null;
              return Promise.reject(refreshError);
            }
          }

          // Стартирай нов refresh
          this.isRefreshing = true;
          this.refreshPromise = this.performTokenRefresh();

          try {
            const accessToken = await this.refreshPromise;
            
            // Retry на оригиналната заявка с новия token
            if (accessToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }

            return this.client(originalRequest);
          } catch (refreshError) {
            return Promise.reject(refreshError);
          } finally {
            // Reset flags след края на refresh
            this.isRefreshing = false;
            this.refreshPromise = null;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Извършва token refresh (изолиран метод за rate limiting)
   */
  private async performTokenRefresh(): Promise<string | null> {
    try {
      const tokenManager = getTokenManager();
      const refreshToken = await tokenManager.getRefreshToken();
      
      if (!refreshToken) {
        // Няма refresh token - clear tokens и logout
        await tokenManager.clearTokens();
        
        // Trigger logout в authStore
        try {
          const { useAuthStore } = await import('../../store/authStore');
          useAuthStore.getState().logout();
        } catch (e) {
          logger.error('Error triggering logout:', e);
        }
        
        throw new Error('No refresh token available');
      }

      // Refresh token
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`,
        { refreshToken }
      );

      const { accessToken, refreshToken: newRefreshToken } = response.data;

      // Запазване на новите tokens
      await tokenManager.setTokens(accessToken, newRefreshToken);

      return accessToken;
    } catch (refreshError) {
      // Refresh failed - clear tokens и logout
      logger.error('Token refresh failed:', refreshError);
      const tokenManager = getTokenManager();
      await tokenManager.clearTokens();
      
      // Trigger logout в authStore
      try {
        const { useAuthStore } = await import('../../store/authStore');
        useAuthStore.getState().logout();
      } catch (e) {
        logger.error('Error triggering logout:', e);
      }
      
      throw refreshError;
    }
  }

  getInstance(): AxiosInstance {
    return this.client;
  }
}

// Singleton instance - lazy initialization to prevent crashes on module load
let apiClientInstance: ApiClient | null = null;

const getApiClient = (): ApiClient => {
  if (!apiClientInstance) {
    try {
      apiClientInstance = new ApiClient();
    } catch (error) {
      logger.error('❌ [ApiClient] Failed to create instance:', error);
      throw error;
    }
  }
  return apiClientInstance;
};

export const apiClient = new Proxy({} as ApiClient, {
  get(target, prop: keyof ApiClient) {
    const instance = getApiClient();
    const value = instance[prop];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  }
});

export default getApiClient().getInstance();

