/**
 * General helper functions за SVMessenger
 */

/**
 * Truncate text до определена дължина
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Debounce function за search input
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Check ако text съдържа само emoji
 */
export const isOnlyEmoji = (text) => {
  if (!text) return false;
  const emojiRegex = /^[\p{Emoji}\s]+$/u;
  return emojiRegex.test(text.trim());
};

/**
 * Escape HTML characters
 */
export const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * Parse URLs in text и wrap в <a> tags
 */
export const linkifyText = (text) => {
  if (!text) return '';
  
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });
};

/**
 * Get initials от name (за fallback avatar)
 * Правилно обработва emoji и специални символи
 */
export const getInitials = (name) => {
  if (!name) return '?';
  
  // Премахни emoji и специални символи за по-добро показване
  const cleanName = name.trim();
  
  // Ако е само emoji, върни първия символ
  if (/^[\p{Emoji}\s]+$/u.test(cleanName)) {
    return cleanName.charAt(0).toUpperCase();
  }
  
  // Раздели по интервали
  const parts = cleanName.split(/\s+/).filter(part => part.length > 0);
  
  if (parts.length >= 2) {
    // Вземи първата буква от първите 2 думи (без emoji)
    const first = parts[0].replace(/[\p{Emoji}]/gu, '').charAt(0);
    const second = parts[1].replace(/[\p{Emoji}]/gu, '').charAt(0);
    if (first && second) {
      return (first + second).toUpperCase();
    }
    if (first) return first.toUpperCase();
    if (second) return second.toUpperCase();
  }
  
  // Ако има само една дума, вземи първите 2 букви (без emoji)
  const singleWord = parts[0] || cleanName;
  const letters = singleWord.replace(/[\p{Emoji}]/gu, '').substring(0, 2);
  if (letters.length >= 2) {
    return letters.toUpperCase();
  }
  if (letters.length === 1) {
    return letters.toUpperCase();
  }
  
  // Fallback: първия символ (дори и emoji)
  return cleanName.charAt(0).toUpperCase();
};

/**
 * Generate random color за avatar background
 */
export const getAvatarColor = (userId) => {
  const colors = [
    '#0084ff', '#00a8ff', '#0066cc', '#4a90e2',
    '#7b68ee', '#9b59b6', '#e74c3c', '#e67e22',
    '#f39c12', '#16a085', '#27ae60', '#2ecc71'
  ];
  return colors[userId % colors.length];
};

/**
 * Scroll to bottom of element smoothly
 */
export const scrollToBottom = (element, smooth = true) => {
  if (!element) return;
  
  element.scrollTo({
    top: element.scrollHeight,
    behavior: smooth ? 'smooth' : 'auto'
  });
};

/**
 * Check ако element е scroll-нат до bottom
 */
export const isScrolledToBottom = (element, threshold = 50) => {
  if (!element) return true;
  
  const { scrollTop, scrollHeight, clientHeight } = element;
  return scrollHeight - scrollTop - clientHeight < threshold;
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
