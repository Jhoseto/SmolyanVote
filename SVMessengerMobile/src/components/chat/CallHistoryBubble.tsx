/**
 * Call History Bubble Component
 * Показва история на обаждане в чата (като Facebook Messenger)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CallHistory } from '../../types/callHistory';
import { Colors, Typography, Spacing } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { TelephoneIcon as PhoneIcon, VideoCameraIcon, ArrowRightIcon, ArrowLeftIcon } from '../common/Icons';

interface CallHistoryBubbleProps {
  callHistory: CallHistory;
}

/**
 * Format duration in seconds to human-readable format (e.g., "5:23" or "1:05:30")
 */
const formatDuration = (seconds: number | undefined | null): string => {
  // CRITICAL: Safety check for invalid duration
  if (!seconds || seconds < 0 || isNaN(seconds)) {
    return '0:00';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format date to relative time (e.g., "Today", "Yesterday", "Jan 15")
 * CRITICAL: Add safety checks for invalid dates
 */
const formatDate = (dateString: string): string => {
  if (!dateString) {
    return '';
  }

  try {
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const callDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const diffTime = today.getTime() - callDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Днес';
    } else if (diffDays === 1) {
      return 'Вчера';
    } else if (diffDays < 7) {
      const weekday = date.toLocaleDateString('bg-BG', { weekday: 'long' });
      return weekday || '';
    } else {
      const formatted = date.toLocaleDateString('bg-BG', { day: 'numeric', month: 'short' });
      return formatted || '';
    }
  } catch (e) {
    // Invalid date - return empty string
    return '';
  }
};

export const CallHistoryBubble: React.FC<CallHistoryBubbleProps> = ({ callHistory }) => {
  // CRITICAL: Safety check for null/undefined callHistory
  if (!callHistory) {
    return null;
  }

  const { user } = useAuthStore();
  // CRITICAL: Add null safety checks to prevent crashes
  // If user is null/undefined or user.id is null/undefined, default to false
  const userId = user?.id ?? null;
  const isOwnCall = userId !== null && callHistory?.callerId !== null && callHistory.callerId === userId;
  const isIncomingCall = userId !== null && callHistory?.receiverId !== null && callHistory.receiverId === userId;

  // Determine call type text and premium graphics
  // CRITICAL: Initialize with default values to prevent undefined
  let callTypeText: string = 'Обаждане';
  let callTypeColor: string = Colors.text?.secondary || '#6b7280';
  let durationText: string = '';
  let showArrow: boolean = false;
  let arrowDirection: 'left' | 'right' | null = null;

  if (callHistory?.status === 'ACCEPTED') {
    // For accepted calls, show "Разговор" with duration
    // CRITICAL: Only show duration if it's greater than 0 (avoid showing "Разговор 0:00")
    if (callHistory.durationSeconds && callHistory.durationSeconds > 0) {
      durationText = formatDuration(callHistory.durationSeconds);
      callTypeText = `Разговор ${durationText}`;
    } else {
      // If duration is 0 or null, just show "Разговор" without duration
      // This prevents showing "Разговор 0:00" for calls that were rejected but somehow marked as ACCEPTED
      callTypeText = 'Разговор';
    }
    callTypeColor = Colors.green?.[600] || '#16a34a';
    // No arrow for accepted calls (both parties connected)
  } else if (callHistory?.status === 'REJECTED') {
    // For rejected calls, show "Отказано" with direction
    callTypeText = 'Отказано';
    callTypeColor = Colors.red?.[500] || '#dc2626';
    showArrow = true;
    arrowDirection = isOwnCall ? 'right' : 'left'; // Outgoing rejected → right, Incoming rejected → left
  } else {
    // For missed/cancelled calls, show "Без отговор" and direction
    // User requested "Без отговор" for these cases
    callTypeText = 'Без отговор';

    // Use Red color for No Answer/Missed calls (Standard UX)
    callTypeColor = Colors.red?.[500] || '#dc2626';

    if (isOwnCall) {
      showArrow = true;
      arrowDirection = 'left'; // Outgoing (Swapped as requested)
    } else {
      showArrow = true;
      arrowDirection = 'right'; // Incoming (Swapped as requested)
    }
  }

  // CRITICAL: Ensure callTypeText and callTypeColor are always valid strings
  if (!callTypeText || typeof callTypeText !== 'string') {
    callTypeText = 'Обаждане';
  }
  if (!callTypeColor || typeof callTypeColor !== 'string') {
    callTypeColor = '#6b7280';
  }

  // Format time as HH:mm (e.g., "22:30" or "15:36")
  // CRITICAL: Add safety checks for invalid dates
  let callTime = '';
  let callDate = '';
  let endTime = '';
  let endDate = '';

  if (callHistory?.startTime) {
    try {
      const date = new Date(callHistory.startTime);
      if (!isNaN(date.getTime())) {
        const timeString = date.toLocaleTimeString('bg-BG', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false, // 24-hour format
        });
        const dateString = formatDate(callHistory.startTime);

        // CRITICAL: Check if strings are valid and not "Invalid Date"
        if (timeString &&
          timeString !== 'Invalid Date' &&
          !timeString.includes('Invalid') &&
          dateString &&
          dateString !== 'Invalid Date' &&
          !dateString.includes('Invalid')) {
          callTime = timeString;
          callDate = dateString;
        }
      }
    } catch (e) {
      // Invalid date - use fallback
      callTime = '';
      callDate = '';
    }
  }

  // Format end time for accepted calls
  if (callHistory?.status === 'ACCEPTED' && callHistory?.endTime) {
    try {
      const date = new Date(callHistory.endTime);
      if (!isNaN(date.getTime())) {
        const timeString = date.toLocaleTimeString('bg-BG', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false, // 24-hour format
        });
        const dateString = formatDate(callHistory.endTime);

        if (timeString &&
          timeString !== 'Invalid Date' &&
          !timeString.includes('Invalid') &&
          dateString &&
          dateString !== 'Invalid Date' &&
          !dateString.includes('Invalid')) {
          endTime = timeString;
          endDate = dateString;
        }
      }
    } catch (e) {
      // Invalid date - use fallback
      endTime = '';
      endDate = '';
    }
  }

  // CRITICAL: Ensure all values are valid strings before rendering
  const safeCallTypeText = String(callTypeText || 'Обаждане');
  const safeCallTypeColor = String(callTypeColor || '#6b7280');
  const safeCallDate = String(callDate || '');
  const safeCallTime = String(callTime || '');
  const hasValidDateTime = safeCallDate !== '' && safeCallTime !== '';

  // CRITICAL: Determine icon component - must be a valid React component, not a string
  const IconComponent = callHistory?.isVideoCall === true ? VideoCameraIcon : PhoneIcon;

  // CRITICAL: Determine arrow component - must be a valid React component or null
  // Add extra safety check to prevent crashes
  const ArrowComponent = (showArrow === true && arrowDirection !== null && (arrowDirection === 'right' || arrowDirection === 'left'))
    ? (arrowDirection === 'right' ? ArrowRightIcon : ArrowLeftIcon)
    : null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Premium minimal design with icons and arrows */}
        <View style={styles.row}>
          {/* Premium icon (phone/video) */}
          <View style={styles.iconContainer}>
            <IconComponent size={14} color={safeCallTypeColor} />
          </View>

          {/* Arrow indicator for direction (premium graphics) */}
          {ArrowComponent !== null && (
            <View style={styles.arrowContainer}>
              <ArrowComponent size={12} color={safeCallTypeColor} />
            </View>
          )}

          {/* Call type text (Входящо, Изходящо, Отказано, Разговор) */}
          <Text style={[styles.callTypeText, { color: safeCallTypeColor }]}>
            {safeCallTypeText}
          </Text>

          {/* Date and time together - only show if valid */}
          {hasValidDateTime ? (
            <Text style={styles.timeText}> • {safeCallDate} {safeCallTime}</Text>
          ) : null}
        </View>

        {/* For accepted calls - show end time and duration */}
        {callHistory?.status === 'ACCEPTED' ? (
          <View style={styles.acceptedCallDetails}>
            {/* End time */}
            {endTime !== '' && endDate !== '' && (
              <Text style={styles.detailText}>
                Приключи: {endDate} {endTime}
              </Text>
            )}
            {/* Duration */}
            {callHistory?.durationSeconds && callHistory.durationSeconds > 0 && (
              <Text style={styles.durationText}>
                Продължителност: {String(formatDuration(callHistory.durationSeconds) || '0:00')}
              </Text>
            )}
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.xs / 2, // Minimal spacing
    alignItems: 'center',
    paddingVertical: 4, // Very minimal padding
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowContainer: {
    marginRight: 4,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7, // Subtle arrow appearance
  },
  callTypeText: {
    fontSize: 13,
    fontWeight: Typography.fontWeight.regular, // Thin font (regular, not semibold)
    letterSpacing: 0.5, // Premium letter spacing for elegance
    color: Colors.text?.secondary || '#6b7280',
  },
  timeText: {
    fontSize: 13,
    fontWeight: Typography.fontWeight.regular, // Thin font
    color: Colors.text?.tertiary || '#9ca3af',
    letterSpacing: 0.3,
    marginLeft: 4,
  },
  dateText: {
    fontSize: 11,
    fontWeight: Typography.fontWeight.regular, // Thin font
    color: Colors.text?.tertiary || '#9ca3af',
    marginTop: 3,
    letterSpacing: 0.2,
    opacity: 0.7, // Subtle appearance
  },
  acceptedCallDetails: {
    marginTop: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailText: {
    fontSize: 11,
    fontWeight: Typography.fontWeight.regular,
    color: Colors.text?.tertiary || '#9ca3af',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  durationText: {
    fontSize: 12,
    fontWeight: Typography.fontWeight.medium, // Slightly bolder for duration
    color: Colors.green?.[600] || '#16a34a',
    marginTop: 4,
    letterSpacing: 0.3,
  },
});
