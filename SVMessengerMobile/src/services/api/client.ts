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
    console.log('🔧 [ApiClient] Initializing with BASE_URL:', API_CONFIG.BASE_URL);
    console.log('🔧 [ApiClient] Development mode:', __DEV__);
    
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
        
        const url = config.url || 'undefined';
        console.log(`📤 [ApiClient] ${config.method?.toUpperCase()} ${url}`, {
          baseURL: config.baseURL,
          hasToken: !!token,
          fullUrl: url === 'undefined' ? 'ERROR: URL is undefined!' : `${config.baseURL}${url}`,
        });
        
        if (!config.url) {
          console.error('❌ [ApiClient] CRITICAL: Request URL is undefined!', {
            method: config.method,
            baseURL: config.baseURL,
            data: config.data,
            stack: new Error().stack,
          });
        }
        
        return config;
      },
      (error: AxiosError) => {
        console.error('❌ [ApiClient] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - обработка на 401 и token refresh
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ [ApiClient] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
        return response;
      },
      async (error: AxiosError) => {
        console.error(`❌ [ApiClient] ${error.config?.method?.toUpperCase()} ${error.config?.url} - Error:`, {
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

          try {
            const tokenManager = getTokenManager();
            // Опит за refresh на token
            const refreshToken = await tokenManager.getRefreshToken();
            
            if (!refreshToken) {
              // Няма refresh token - clear tokens и logout
              await tokenManager.clearTokens();
              console.log('No refresh token available, logging out...');
              
              // Trigger logout в authStore
              try {
                const { useAuthStore } = await import('../../store/authStore');
                useAuthStore.getState().logout();
              } catch (e) {
                console.error('Error triggering logout:', e);
              }
              
              return Promise.reject(error);
            }

            console.log('Token expired, attempting refresh...');

            // Refresh token
            const response = await axios.post(
              `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`,
              { refreshToken }
            );

            const { accessToken, refreshToken: newRefreshToken } = response.data;

            // Запазване на новите tokens
            await tokenManager.setTokens(accessToken, newRefreshToken);

            console.log('Token refreshed successfully, retrying request...');

            // Retry на оригиналната заявка с новия token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }

            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed - clear tokens и logout
            console.error('Token refresh failed:', refreshError);
            const tokenManager = getTokenManager();
            await tokenManager.clearTokens();
            
            // Trigger logout в authStore
            try {
              const { useAuthStore } = await import('../../store/authStore');
              useAuthStore.getState().logout();
            } catch (e) {
              console.error('Error triggering logout:', e);
            }
            
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

// Singleton instance - lazy initialization to prevent crashes on module load
let apiClientInstance: ApiClient | null = null;

const getApiClient = (): ApiClient => {
  if (!apiClientInstance) {
    try {
      console.log('🔧 [ApiClient] Creating singleton instance...');
      apiClientInstance = new ApiClient();
      console.log('✅ [ApiClient] Singleton instance created');
    } catch (error) {
      console.error('❌ [ApiClient] Failed to create instance:', error);
      throw error;
    }
  }
  return apiClientInstance;
};

export const apiClient = new Proxy({} as ApiClient, {
  get(target, prop) {
    const instance = getApiClient();
    const value = (instance as any)[prop];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  }
});

export default getApiClient().getInstance();

