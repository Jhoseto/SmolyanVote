/**
 * Call History Bubble Component
 * Показва история на обаждане в чата (като Facebook Messenger)
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CallHistory } from '../../types/callHistory';
import { Colors, Typography, Spacing } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { PhoneIcon, VideoCameraIcon, ArrowRightIcon, ArrowLeftIcon } from '../common/Icons';

interface CallHistoryBubbleProps {
  callHistory: CallHistory;
}

/**
 * Format duration in seconds to human-readable format (e.g., "5:23" or "1:05:30")
 */
const formatDuration = (seconds: number): string => {
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
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
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
    return date.toLocaleDateString('bg-BG', { weekday: 'long' });
  } else {
    return date.toLocaleDateString('bg-BG', { day: 'numeric', month: 'short' });
  }
};

export const CallHistoryBubble: React.FC<CallHistoryBubbleProps> = ({ callHistory }) => {
  const { user } = useAuthStore();
  const isOwnCall = callHistory.callerId === user?.id;
  const isIncomingCall = callHistory.receiverId === user?.id;

  // Determine call status text and icon color
  let statusText: string;
  let statusColor: string;
  let iconColor: string;
  let durationText: string = '';

  switch (callHistory.status) {
    case 'ACCEPTED':
      // CRITICAL FIX: Show duration if call was answered and completed
      if (callHistory.durationSeconds && callHistory.durationSeconds > 0) {
        durationText = formatDuration(callHistory.durationSeconds);
        statusText = `Разговор: ${durationText}`;
      } else {
        statusText = 'Прието';
      }
      statusColor = Colors.green[600];
      iconColor = Colors.green[600];
      break;
    case 'REJECTED':
      statusText = isIncomingCall ? 'Отказано от теб' : 'Отказано';
      statusColor = Colors.red[600];
      iconColor = Colors.red[600];
      break;
    case 'MISSED':
      statusText = isIncomingCall ? 'Пропуснато от теб' : 'Неотговорено';
      statusColor = Colors.red[600];
      iconColor = Colors.red[600];
      break;
    case 'CANCELLED':
      statusText = isOwnCall ? 'Отменено от теб' : 'Отменено';
      statusColor = Colors.gray[600];
      iconColor = Colors.gray[600];
      break;
    default:
      statusText = 'Неизвестно';
      statusColor = Colors.gray[600];
      iconColor = Colors.gray[600];
  }

  // CRITICAL FIX: Show clear call direction - who called whom
  // Format: "Ти звънна на [Name]" or "[Name] звънна на теб"
  const callDirectionText = isOwnCall 
    ? `Ти звънна на ${callHistory.receiverName}`
    : `${callHistory.callerName} звънна на теб`;

  // Format time
  const callTime = new Date(callHistory.startTime).toLocaleTimeString('bg-BG', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Format date
  const callDate = formatDate(callHistory.startTime);

  // CRITICAL FIX: Determine arrow icon and direction based on call type
  // Outgoing call (isOwnCall) → ArrowRightIcon (→)
  // Incoming call (!isOwnCall) → ArrowLeftIcon (←)
  const ArrowIcon = isOwnCall ? ArrowRightIcon : ArrowLeftIcon;
  
  // Determine arrow color based on status
  // Green for accepted calls, red for missed/rejected, gray for cancelled
  const arrowColor = callHistory.status === 'ACCEPTED' 
    ? Colors.green[600] 
    : callHistory.status === 'MISSED' || callHistory.status === 'REJECTED'
    ? Colors.red[600]
    : Colors.gray[600];

  return (
    <View style={styles.container}>
      <View style={[styles.bubble, { borderColor: statusColor + '40' }]}>
        {/* Main icon (phone/video) with arrow indicator */}
        <View style={styles.iconContainer}>
          <View style={[styles.iconWrapper, { backgroundColor: iconColor + '15' }]}>
            {callHistory.isVideoCall ? (
              <VideoCameraIcon size={18} color={iconColor} />
            ) : (
              <PhoneIcon size={18} color={iconColor} />
            )}
          </View>
          {/* Arrow indicator showing call direction */}
          <View style={[styles.arrowContainer, { backgroundColor: arrowColor + '20' }]}>
            <ArrowIcon size={14} color={arrowColor} />
          </View>
        </View>
        <View style={styles.content}>
          <Text style={styles.callDirectionText}>{callDirectionText}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {statusText}
              </Text>
            </View>
            <Text style={styles.timeText}> • {callTime}</Text>
          </View>
          <Text style={styles.dateText}>{callDate}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.xs,
    alignItems: 'center',
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 20,
    maxWidth: '80%',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    marginRight: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  arrowContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: -2,
    right: -4,
    borderWidth: 1.5,
    borderColor: Colors.background.primary,
  },
  content: {
    flex: 1,
  },
  callDirectionText: {
    ...Typography.body.sm,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 4,
  },
  statusText: {
    ...Typography.body.xs,
    fontWeight: Typography.fontWeight.semibold,
    fontSize: 11,
  },
  timeText: {
    ...Typography.body.xs,
    color: Colors.text.secondary,
    fontSize: 11,
  },
  dateText: {
    ...Typography.body.xs,
    color: Colors.text.secondary,
    marginTop: 2,
    fontStyle: 'italic',
    fontSize: 10,
  },
});
