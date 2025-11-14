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
 * Групира съобщения по дата
 */
export const groupMessagesByDate = (messages) => {
  if (!messages || messages.length === 0) return [];
  
  // Филтрирай невалидни съобщения
  const validMessages = messages.filter(msg => 
    msg && 
    msg.id && 
    msg.sentAt && 
    (typeof msg === 'object')
  );
  
  if (validMessages.length === 0) return [];
  
  const grouped = [];
  let currentDate = null;
  
  validMessages.forEach((message, index) => {
    if (!message || !message.sentAt) return;
    
    try {
      const messageDate = typeof message.sentAt === 'string' ? parseISO(message.sentAt) : new Date(message.sentAt);
      const dateKey = format(messageDate, 'yyyy-MM-dd');
      
      if (dateKey !== currentDate) {
        grouped.push({
          type: 'date',
          date: messageDate,
          dateKey: dateKey,
          formattedDate: formatDateSeparator(messageDate)
        });
        currentDate = dateKey;
      }
      
      grouped.push({
        type: 'message',
        message: message
      });
    } catch (error) {
      console.warn('Error processing message in groupMessagesByDate:', error, message);
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