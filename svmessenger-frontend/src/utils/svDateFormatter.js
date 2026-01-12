/**
 * Date formatting utilities за SVMessenger
 */

import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';
import { bg } from 'date-fns/locale';

/**
 * Форматира timestamp за conversation list
 * Examples: "Сега", "5 мин", "2 ч", "Вчера", "12 яну"
 */
export const formatConversationTime = (timestamp) => {
  if (!timestamp) return '';
  
  try {
    const date = typeof timestamp === 'string' ? parseISO(timestamp) : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMinutes < 1) {
      return 'Сега';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} мин`;
    } else if (diffHours < 24 && isToday(date)) {
      return `${diffHours} ч`;
    } else if (isYesterday(date)) {
      return 'Вчера';
    } else if (diffDays < 7) {
      return `${diffDays} д`;
    } else {
      return format(date, 'd MMM', { locale: bg });
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Форматира timestamp за message bubble
 * Examples: "10:30", "Вчера 14:20", "12 яну 09:15"
 */
export const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';
  
  try {
    const date = typeof timestamp === 'string' ? parseISO(timestamp) : new Date(timestamp);
    
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Вчера ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'd MMM HH:mm', { locale: bg });
    }
  } catch (error) {
    console.error('Error formatting message time:', error);
    return '';
  }
};

/**
 * Форматира timestamp за tooltip (пълна дата)
 * Example: "22 октомври 2025, 14:30"
 */
export const formatFullDateTime = (timestamp) => {
  if (!timestamp) return '';
  
  try {
    const date = typeof timestamp === 'string' ? parseISO(timestamp) : new Date(timestamp);
    return format(date, 'd MMMM yyyy, HH:mm', { locale: bg });
  } catch (error) {
    console.error('Error formatting full date:', error);
    return '';
  }
};

/**
 * Форматира relative time (за online status)
 * Example: "преди 5 минути", "преди 2 часа"
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '';
  
  try {
    const date = typeof timestamp === 'string' ? parseISO(timestamp) : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true, locale: bg });
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return '';
  }
};

/**
 * Групира съобщения и call history по дата
 * Поддържа както messages (с sentAt), така и callHistory (с startTime)
 */
export const groupMessagesByDate = (messages, callHistory = []) => {
  const allItems = [];
  
  // Добави съобщения
  if (messages && Array.isArray(messages)) {
    messages.forEach(msg => {
      if (msg && msg.id && msg.sentAt) {
        allItems.push({
          type: 'message',
          data: msg,
          timestamp: msg.sentAt
        });
      }
    });
  }
  
  // Добави call history
  if (callHistory && Array.isArray(callHistory)) {
    callHistory.forEach(call => {
      if (call && call.id && call.startTime) {
        allItems.push({
          type: 'callHistory',
          data: call,
          timestamp: call.startTime
        });
      }
    });
  }
  
  if (allItems.length === 0) return [];
  
  // Сортирай всички items по timestamp (ascending - oldest first)
  allItems.sort((a, b) => {
    const timeA = a.timestamp ? (typeof a.timestamp === 'string' ? parseISO(a.timestamp).getTime() : new Date(a.timestamp).getTime()) : 0;
    const timeB = b.timestamp ? (typeof b.timestamp === 'string' ? parseISO(b.timestamp).getTime() : new Date(b.timestamp).getTime()) : 0;
    return timeA - timeB;
  });
  
  // Групирай по дата
  const grouped = [];
  let currentDate = null;
  
  allItems.forEach((item) => {
    if (!item || !item.timestamp) return;
    
    try {
      const itemDate = typeof item.timestamp === 'string' ? parseISO(item.timestamp) : new Date(item.timestamp);
      const dateKey = format(itemDate, 'yyyy-MM-dd');
      
      if (dateKey !== currentDate) {
        grouped.push({
          type: 'date',
          date: itemDate,
          dateKey: dateKey,
          formattedDate: formatDateSeparator(itemDate)
        });
        currentDate = dateKey;
      }
      
      // Добави item (message или callHistory)
      if (item.type === 'message') {
        grouped.push({
          type: 'message',
          message: item.data
        });
      } else if (item.type === 'callHistory') {
        grouped.push({
          type: 'callHistory',
          callHistory: item.data
        });
      }
    } catch (error) {
      console.warn('Error processing item in groupMessagesByDate:', error, item);
    }
  });
  
  return grouped;
};

/**
 * Форматира дата за separator в chat
 * Examples: "Днес", "Вчера", "27 октомври 2025"
 */
export const formatDateSeparator = (date) => {
  if (!date) return '';
  
  try {
    const d = typeof date === 'string' ? parseISO(date) : new Date(date);
    
    if (isToday(d)) {
      return 'Днес';
    } else if (isYesterday(d)) {
      return 'Вчера';
    } else {
      return format(d, 'd MMMM yyyy', { locale: bg });
    }
  } catch (error) {
    console.error('Error formatting date separator:', error);
    return '';
  }
};

/**
 * Връща само часа на съобщението
 * Example: "14:30"
 */
export const formatMessageTimeOnly = (timestamp) => {
  if (!timestamp) return '';
  
  try {
    const date = typeof timestamp === 'string' ? parseISO(timestamp) : new Date(timestamp);
    return format(date, 'HH:mm');
  } catch (error) {
    console.error('Error formatting message time:', error);
    return '';
  }
};