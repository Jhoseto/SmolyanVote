/**
 * Conversation Item Component
 * Показва един разговор в списъка
 */

import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Avatar, Badge } from '../common';
import { Conversation } from '../../types/conversation';
import { Colors, Typography, Spacing } from '../../theme';

interface ConversationItemProps {
  conversation: Conversation;
  onPress: () => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  onPress,
}) => {
  // Защита срещу undefined данни
  if (!conversation || !conversation.participant) {
    console.error('ConversationItem: invalid conversation data', conversation);
    return null;
  }

  const { participant, lastMessage, unreadCount, updatedAt } = conversation;

  const formatTime = (dateString: string) => {
    try {
      const { formatChatTime } = require('../../utils/formatting');
      return formatChatTime(dateString);
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };

  const participantName = participant?.fullName || participant?.username || 'Unknown';
  const participantImage = participant?.imageUrl || undefined;
  const participantOnline = participant?.isOnline || false;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <Avatar
        imageUrl={participantImage}
        name={participantName}
        size={50}
        isOnline={participantOnline}
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {participantName}
          </Text>
          {updatedAt && (
            <Text style={styles.time}>{formatTime(updatedAt)}</Text>
          )}
        </View>
        <View style={styles.footer}>
          {lastMessage && lastMessage.text ? (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {lastMessage.text}
            </Text>
          ) : (
            <Text style={styles.noMessage}>Няма съобщения</Text>
          )}
          {unreadCount > 0 && <Badge count={unreadCount} size="small" />}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    backgroundColor: Colors.background.primary,
  },
  content: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  name: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    flex: 1,
  },
  time: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    marginLeft: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    flex: 1,
  },
  noMessage: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
  },
});

