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
 */
export const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
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
