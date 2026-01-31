/**
 * REST API Service за SVMessenger
 * Всички HTTP requests към backend
 */

const BASE_URL = '/api/svmessenger';

/**
 * Get CSRF token from multiple sources (priority order)
 */
const getCsrfToken = () => {
  // 1. Try window.CSRF_TOKEN (от topHtmlStyles fragment) - НАЙ-БЪРЗО
  if (window.CSRF_TOKEN) return window.CSRF_TOKEN;

  // 2. Try window.getCsrfToken() function (от topHtmlStyles fragment)
  if (window.getCsrfToken && typeof window.getCsrfToken === 'function') {
    const token = window.getCsrfToken();
    if (token) return token;
  }

  // 3. Try meta tag (Spring Security default)
  const meta = document.querySelector('meta[name="_csrf"]');
  if (meta && meta.content) return meta.content;

  // 4. Try window.SVMESSENGER_CSRF (от svMessengerWidget)
  if (window.SVMESSENGER_CSRF && window.SVMESSENGER_CSRF.token) {
    return window.SVMESSENGER_CSRF.token;
  }

  // 5. Fallback to XSRF-TOKEN cookie (CookieCsrfTokenRepository)
  const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
};

/**
 * Get CSRF header name from multiple sources (priority order)
 */
const getCsrfHeader = () => {
  // 1. Try window.CSRF_HEADER (от topHtmlStyles fragment) - НАЙ-БЪРЗО
  if (window.CSRF_HEADER) return window.CSRF_HEADER;

  // 2. Try window.getCsrfHeader() function (от topHtmlStyles fragment)
  if (window.getCsrfHeader && typeof window.getCsrfHeader === 'function') {
    return window.getCsrfHeader();
  }

  // 3. Try meta tag
  const meta = document.querySelector('meta[name="_csrf_header"]');
  if (meta && meta.content) return meta.content;

  // 4. Try window.SVMESSENGER_CSRF (от svMessengerWidget)
  if (window.SVMESSENGER_CSRF && window.SVMESSENGER_CSRF.headerName) {
    return window.SVMESSENGER_CSRF.headerName;
  }

  return 'X-XSRF-TOKEN';
};

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

  // ✅ Add CSRF token (required for POST/PUT/DELETE)
  const csrfToken = getCsrfToken();
  const csrfHeader = getCsrfHeader();

  if (csrfToken && csrfHeader) {
    defaultOptions.headers[csrfHeader] = csrfToken;
  } else {
    console.warn('⚠️ CSRF token not found - API call may fail');
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

  markAllUndeliveredAsDelivered: async () => {
    return fetchAPI(`${BASE_URL}/messages/delivered`, {
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
    return fetchAPI(`${BASE_URL}/messages/conversation/${conversationId}?page=${page}&size=${size}`);
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

  // ========== VOICE CALLS ==========

  /**
   * Генерира LiveKit token за voice call
   */
  getCallToken: async (conversationId, otherUserId) => {
    return fetchAPI(`${BASE_URL}/call/token`, {
      method: 'POST',
      body: JSON.stringify({ conversationId, otherUserId })
    });
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
  },

  // ========== CALL HISTORY ==========

  /**
   * Вземи call history за конкретен разговор
   */
  /**
   * Вземи call history за разговор
   * CRITICAL FIX: Endpoint must match backend: /conversations/{id}/call-history
   */
  getCallHistory: async (conversationId) => {
    return fetchAPI(`${BASE_URL}/conversations/${conversationId}/call-history`);
  },

  // ========== TRANSLATION ==========

  /**
   * Translate and save message (new per-user translation system)
   * Calls /translate-and-save which checks DB cache first
   */
  translateAndSaveMessage: async (messageId, targetLanguage) => {
    return fetchAPI(`${BASE_URL}/translate-and-save`, {
      method: 'POST',
      body: JSON.stringify({ messageId, targetLanguage })
    });
  }
};
