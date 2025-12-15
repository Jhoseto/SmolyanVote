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
  const { participant, lastMessage, unreadCount, updatedAt } = conversation;

  const formatTime = (dateString: string) => {
    const { formatChatTime } = require('../../utils/formatting');
    return formatChatTime(dateString);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <Avatar
        imageUrl={participant.imageUrl}
        name={participant.fullName}
        size={50}
        isOnline={participant.isOnline}
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {participant.fullName}
          </Text>
          {updatedAt && (
            <Text style={styles.time}>{formatTime(updatedAt)}</Text>
          )}
        </View>
        <View style={styles.footer}>
          {lastMessage ? (
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

