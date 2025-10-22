import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek, isThisYear } from 'date-fns';
import { bg } from 'date-fns/locale';

/**
 * Utility функции за форматиране на дати
 */

/**
 * Форматирай дата за показване в чат
 */
export function formatMessageDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  
  if (isToday(date)) {
    return format(date, 'HH:mm', { locale: bg });
  } else if (isYesterday(date)) {
    return 'Вчера ' + format(date, 'HH:mm', { locale: bg });
  } else if (isThisWeek(date)) {
    return format(date, 'EEEE HH:mm', { locale: bg });
  } else if (isThisYear(date)) {
    return format(date, 'dd MMM HH:mm', { locale: bg });
  } else {
    return format(date, 'dd.MM.yyyy HH:mm', { locale: bg });
  }
}

/**
 * Форматирай дата за conversation list
 */
export function formatConversationDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  
  if (isToday(date)) {
    return format(date, 'HH:mm', { locale: bg });
  } else if (isYesterday(date)) {
    return 'Вчера';
  } else if (isThisWeek(date)) {
    return format(date, 'EEEE', { locale: bg });
  } else if (isThisYear(date)) {
    return format(date, 'dd MMM', { locale: bg });
  } else {
    return format(date, 'dd.MM.yyyy', { locale: bg });
  }
}

/**
 * Относително време (например "преди 5 минути")
 */
export function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  return formatDistanceToNow(date, { 
    addSuffix: true, 
    locale: bg 
  });
}

/**
 * Провери дали датата е днес
 */
export function isTodayDate(dateString) {
  return isToday(new Date(dateString));
}

/**
 * Провери дали датата е вчера
 */
export function isYesterdayDate(dateString) {
  return isYesterday(new Date(dateString));
}
