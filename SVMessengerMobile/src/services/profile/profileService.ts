/**
 * Profile Service
 * Управление на профил от мобилното приложение
 */

import apiClient from '../api/client';
import { API_CONFIG } from '../../config/api';
import { User } from '../../types/auth';

export interface UpdateProfileRequest {
  profileImage?: {
    uri: string;
    type: string;
    name: string;
  };
  bio?: string;
}

export interface UpdateProfileResponse {
  success: boolean;
  user: User;
  message?: string;
  error?: string;
}

class ProfileService {
  /**
   * Обновява профил на потребителя (снимка и/или bio)
   * Използва същия backend endpoint като web версията
   */
  async updateProfile(request: UpdateProfileRequest): Promise<UpdateProfileResponse> {
    try {
      const formData = new FormData();

      // Add profile image if provided
      if (request.profileImage) {
        formData.append('profileImage', {
          uri: request.profileImage.uri,
          type: request.profileImage.type,
          name: request.profileImage.name,
        } as any);
      }

      // Add bio if provided
      if (request.bio !== undefined && request.bio !== null) {
        formData.append('bio', request.bio);
      }

      // Axios автоматично обработва FormData - не задаваме Content-Type header
      // Interceptor-ът в apiClient ще премахне Content-Type за FormData
      const response = await apiClient.put(
        API_CONFIG.ENDPOINTS.PROFILE.UPDATE,
        formData
      );

      return response.data;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      throw new Error(
        error.response?.data?.error || 
        error.message || 
        'Грешка при обновяване на профила'
      );
    }
  }

  /**
   * Връща текущия профил на потребителя
   */
  async getProfile(): Promise<User> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.PROFILE.GET);
      return response.data.user;
    } catch (error: any) {
      console.error('Error getting profile:', error);
      throw new Error(
        error.response?.data?.error || 
        error.message || 
        'Грешка при зареждане на профила'
      );
    }
  }
}

export const profileService = new ProfileService();
export default profileService;

