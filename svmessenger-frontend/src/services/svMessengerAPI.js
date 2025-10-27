/**
 * REST API Service за SVMessenger
 * Всички HTTP requests към backend
 */

const BASE_URL = '/api/svmessenger';

/**
 * Generic fetch wrapper с error handling и CSRF token
 */
const fetchAPI = async (url, options = {}) => {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include session cookies
  };
  
  // Add CSRF token if available
  if (window.SVMESSENGER_CSRF && window.SVMESSENGER_CSRF.token) {
    defaultOptions.headers[window.SVMESSENGER_CSRF.headerName] = window.SVMESSENGER_CSRF.token;
  }
  
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
   * Изтрий разговор (soft delete)
   */
  deleteConversation: async (conversationId) => {
    return fetchAPI(`${BASE_URL}/conversations/${conversationId}`, {
      method: 'DELETE'
    });
  },
  
  /**
   * Скрий разговор от панела (не изтрива историята)
   */
  hideConversation: async (conversationId) => {
    return fetchAPI(`${BASE_URL}/conversations/${conversationId}/hide`, {
      method: 'PUT'
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
    // Always send the query to backend, let backend handle empty/short queries
    return fetchAPI(`${BASE_URL}/users/search?query=${encodeURIComponent(query || '')}`);
  },
  
  /**
   * Търси в следвани потребители по username/име
   */
  searchFollowingUsers: async (query) => {
    const url = query ? 
      `${BASE_URL}/users/following?query=${encodeURIComponent(query)}` : 
      `${BASE_URL}/users/following`;
    return fetchAPI(url);
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
