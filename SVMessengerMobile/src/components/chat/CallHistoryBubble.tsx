/**
 * Call History Bubble Component
 * Показва история на обаждане в чата (като Facebook Messenger)
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CallHistory } from '../../types/callHistory';
import { Colors, Typography, Spacing } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { PhoneIcon, VideoCameraIcon } from '../common/Icons';

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

  switch (callHistory.status) {
    case 'ACCEPTED':
      statusText = callHistory.durationSeconds 
        ? formatDuration(callHistory.durationSeconds)
        : 'Прието';
      statusColor = Colors.green[600];
      iconColor = Colors.green[600];
      break;
    case 'REJECTED':
      statusText = 'Отказано';
      statusColor = Colors.red[600];
      iconColor = Colors.red[600];
      break;
    case 'MISSED':
      statusText = isIncomingCall ? 'Пропуснато' : 'Неотговорено';
      statusColor = Colors.red[600];
      iconColor = Colors.red[600];
      break;
    case 'CANCELLED':
      statusText = 'Отменено';
      statusColor = Colors.gray[600];
      iconColor = Colors.gray[600];
      break;
    default:
      statusText = 'Неизвестно';
      statusColor = Colors.gray[600];
      iconColor = Colors.gray[600];
  }

  // Determine call direction text
  const callDirectionText = isOwnCall 
    ? `Обаждане до ${callHistory.receiverName}`
    : `Обаждане от ${callHistory.callerName}`;

  // Format time
  const callTime = new Date(callHistory.startTime).toLocaleTimeString('bg-BG', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <View style={styles.iconContainer}>
          {callHistory.isVideoCall ? (
            <VideoCameraIcon size={20} color={iconColor} />
          ) : (
            <PhoneIcon size={20} color={iconColor} />
          )}
        </View>
        <View style={styles.content}>
          <Text style={styles.callDirectionText}>{callDirectionText}</Text>
          <View style={styles.statusRow}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusText}
            </Text>
            <Text style={styles.timeText}> • {callTime}</Text>
          </View>
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
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  iconContainer: {
    marginRight: Spacing.sm,
  },
  content: {
    flex: 1,
  },
  callDirectionText: {
    ...Typography.body.sm,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    ...Typography.body.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  timeText: {
    ...Typography.body.xs,
    color: Colors.text.secondary,
  },
});
