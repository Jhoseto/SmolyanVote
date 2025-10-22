/**
 * Service за API calls към SVMessenger backend
 */

const API_BASE_URL = '/api/svmessenger';

class SVMessengerService {
  
  /**
   * Generic API call method
   */
  async apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    const config = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };
    
    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }
  
  // ========== CONVERSATIONS ==========
  
  /**
   * Вземи всички разговори за текущия user
   */
  async getConversations() {
    return this.apiCall('/conversations');
  }
  
  /**
   * Вземи конкретен разговор
   */
  async getConversation(conversationId) {
    return this.apiCall(`/conversations/${conversationId}`);
  }
  
  /**
   * Започни нов разговор
   */
  async startConversation(recipientId) {
    return this.apiCall('/conversations/start', {
      method: 'POST',
      body: JSON.stringify({ recipientId })
    });
  }
  
  // ========== MESSAGES ==========
  
  /**
   * Вземи съобщения за разговор с pagination
   */
  async getMessages(conversationId, page = 0, size = 20) {
    return this.apiCall(`/conversations/${conversationId}/messages?page=${page}&size=${size}`);
  }
  
  /**
   * Изпрати съобщение
   */
  async sendMessage(conversationId, messageText) {
    return this.apiCall(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ messageText })
    });
  }
  
  /**
   * Маркирай съобщение като прочетено
   */
  async markAsRead(messageId) {
    return this.apiCall(`/messages/${messageId}/read`, {
      method: 'PUT'
    });
  }
  
  /**
   * Маркирай всички съобщения в разговор като прочетени
   */
  async markAllAsRead(conversationId) {
    return this.apiCall(`/conversations/${conversationId}/read`, {
      method: 'PUT'
    });
  }
  
  // ========== USERS ==========
  
  /**
   * Търси потребители
   */
  async searchUsers(query) {
    return this.apiCall(`/users/search?q=${encodeURIComponent(query)}`);
  }
  
  /**
   * Вземи информация за потребител
   */
  async getUser(userId) {
    return this.apiCall(`/users/${userId}`);
  }
  
  // ========== TYPING STATUS ==========
  
  /**
   * Изпрати typing status
   */
  async sendTypingStatus(conversationId, isTyping) {
    return this.apiCall('/typing', {
      method: 'POST',
      body: JSON.stringify({
        conversationId,
        isTyping
      })
    });
  }
  
  // ========== UTILITY METHODS ==========
  
  /**
   * Провери дали API е достъпен
   */
  async healthCheck() {
    try {
      await this.apiCall('/health');
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const svMessengerService = new SVMessengerService();
