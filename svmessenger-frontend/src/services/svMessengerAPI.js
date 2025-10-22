/**
 * REST API Service за SVMessenger
 * Всички HTTP requests към backend
 */

const BASE_URL = '/api/svmessenger';

/**
 * Generic fetch wrapper с error handling
 */
const fetchAPI = async (url, options = {}) => {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include session cookies
  };
  
  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        message: `HTTP ${response.status}: ${response.statusText}` 
      }));
      throw new Error(error.message || 'API request failed');
    }
    
    return response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const svMessengerAPI = {
  
  // ========== CONVERSATIONS ==========
  
  /**
   * Вземи всички разговори на current user
   */
  getConversations: async () => {
    return fetchAPI(`${BASE_URL}/conversations`);
  },
  
  /**
   * Вземи конкретен разговор по ID
   */
  getConversation: async (conversationId) => {
    return fetchAPI(`${BASE_URL}/conversations/${conversationId}`);
  },
  
  /**
   * Старт на нов разговор или вземи съществуващ
   */
  startConversation: async (otherUserId, initialMessage = null) => {
    return fetchAPI(`${BASE_URL}/conversations/start`, {
      method: 'POST',
      body: JSON.stringify({ otherUserId, initialMessage })
    });
  },
  
  /**
   * Маркирай всички съобщения в разговор като прочетени
   */
  markAsRead: async (conversationId) => {
    return fetchAPI(`${BASE_URL}/conversations/${conversationId}/read`, {
      method: 'PUT'
    });
  },
  
  /**
   * Изтрий разговор
   */
  deleteConversation: async (conversationId) => {
    return fetchAPI(`${BASE_URL}/conversations/${conversationId}`, {
      method: 'DELETE'
    });
  },
  
  // ========== MESSAGES ==========
  
  /**
   * Вземи съобщения с pagination
   */
  getMessages: async (conversationId, page = 0, size = 50) => {
    return fetchAPI(`${BASE_URL}/messages/${conversationId}?page=${page}&size=${size}`);
  },
  
  /**
   * Изпрати ново съобщение (HTTP fallback за WebSocket)
   */
  sendMessage: async (conversationId, text) => {
    return fetchAPI(`${BASE_URL}/messages/send`, {
      method: 'POST',
      body: JSON.stringify({ 
        conversationId, 
        text, 
        messageType: 'TEXT' 
      })
    });
  },
  
  /**
   * Маркирай съобщение като прочетено
   */
  markMessageAsRead: async (messageId) => {
    return fetchAPI(`${BASE_URL}/messages/${messageId}/read`, {
      method: 'PUT'
    });
  },
  
  /**
   * Изтрий съобщение
   */
  deleteMessage: async (messageId) => {
    return fetchAPI(`${BASE_URL}/messages/${messageId}`, {
      method: 'DELETE'
    });
  },
  
  /**
   * Редактирай съобщение
   */
  editMessage: async (messageId, newText) => {
    return fetchAPI(`${BASE_URL}/messages/${messageId}/edit`, {
      method: 'PUT',
      body: JSON.stringify({ newText })
    });
  },
  
  // ========== USERS ==========
  
  /**
   * Търси потребители по username/име
   */
  searchUsers: async (query) => {
    if (!query || query.length < 2) {
      return [];
    }
    return fetchAPI(`${BASE_URL}/users/search?query=${encodeURIComponent(query)}`);
  },
  
  // ========== STATISTICS ==========
  
  /**
   * Общ брой непрочетени съобщения
   */
  getUnreadCount: async () => {
    return fetchAPI(`${BASE_URL}/unread-count`);
  },
  
  // ========== TYPING STATUS ==========
  
  /**
   * Update typing status (HTTP fallback за WebSocket)
   */
  updateTypingStatus: async (conversationId, isTyping) => {
    return fetchAPI(`${BASE_URL}/typing`, {
      method: 'POST',
      body: JSON.stringify({ conversationId, isTyping })
    });
  }
};
