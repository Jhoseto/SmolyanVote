/**
 * Utility функции за работа с текстове
 */

/**
 * Скъси текст до определена дължина
 */
export function truncateText(text, maxLength = 50) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Извлечи първите думи от текст
 */
export function getFirstWords(text, wordCount = 3) {
  if (!text) return '';
  const words = text.split(' ');
  if (words.length <= wordCount) return text;
  return words.slice(0, wordCount).join(' ') + '...';
}

/**
 * Провери дали текст съдържа само emoji
 */
export function isOnlyEmoji(text) {
  if (!text) return false;
  // Regex за emoji characters
  const emojiRegex = /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]$/u;
  return emojiRegex.test(text.trim());
}

/**
 * Форматирай име за показване
 */
export function formatDisplayName(user) {
  if (!user) return 'Неизвестен потребител';
  return user.realName || user.username || 'Без име';
}

/**
 * Генерирай инициали от име
 */
export function getInitials(name) {
  if (!name) return '?';
  const words = name.trim().split(' ');
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}

/**
 * Провери дали текст е празен или само whitespace
 */
export function isEmpty(text) {
  return !text || text.trim().length === 0;
}

/**
 * Escape HTML characters
 */
export function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Форматирай текст за показване (основно за съобщения)
 */
export function formatMessageText(text) {
  if (!text) return '';
  
  // Escape HTML
  let formatted = escapeHtml(text);
  
  // Convert newlines to <br>
  formatted = formatted.replace(/\n/g, '<br>');
  
  // Convert URLs to links
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  formatted = formatted.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  
  return formatted;
}
