/**
 * Formatting Utilities
 * Форматиране на дати, текст, и др.
 */

/**
 * Форматира дата в относителен формат
 */
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return 'сега';
  } else if (minutes < 60) {
    return `преди ${minutes} мин`;
  } else if (hours < 24) {
    return `преди ${hours} ч`;
  } else if (days < 7) {
    return `преди ${days} дни`;
  } else {
    return date.toLocaleDateString('bg-BG', {
      day: '2-digit',
      month: '2-digit',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
};

/**
 * Форматира време за показване в чат
 */
export const formatChatTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = diff / (1000 * 60 * 60);

  if (hours < 24) {
    return date.toLocaleTimeString('bg-BG', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } else {
    return date.toLocaleDateString('bg-BG', {
      day: '2-digit',
      month: '2-digit',
    });
  }
};

/**
 * Форматира текст - премахва излишни whitespace
 */
export const formatText = (text: string): string => {
  return text.trim().replace(/\s+/g, ' ');
};

/**
 * Скъсява текст до определен брой символи
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

