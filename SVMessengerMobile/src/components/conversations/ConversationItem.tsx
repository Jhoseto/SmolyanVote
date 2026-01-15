/**
 * Conversation Item Component
 * Показва един разговор в списъка
 */

import React, { useRef } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Alert } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Avatar, Badge, FadeInView } from '../common';
import { Conversation } from '../../types/conversation';
import { Colors, Typography, Spacing } from '../../theme';
import { useConversationsStore } from '../../store/conversationsStore';
import { TrashIcon, EyeSlashIcon } from '../common/Icons';

interface ConversationItemProps {
  conversation: Conversation;
  onPress: () => void;
  index: number; // Added for staggered animation
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  onPress,
  index,
}) => {
  const swipeableRef = useRef<Swipeable>(null);
  const { deleteConversation, hideConversation } = useConversationsStore();

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

  const handleDelete = () => {
    Alert.alert(
      'Изтриване на разговор',
      'Сигурен ли си, че искаш да изтриеш този разговор?',
      [
        { text: 'Отказ', style: 'cancel', onPress: () => swipeableRef.current?.close() },
        {
          text: 'Изтрий',
          style: 'destructive',
          onPress: async () => {
            await deleteConversation(conversation.id);
            swipeableRef.current?.close();
          },
        },
      ]
    );
  };

  const handleHide = () => {
    Alert.alert(
      'Скриване на разговор',
      'Сигурен ли си, че искаш да скриеш този разговор?',
      [
        { text: 'Отказ', style: 'cancel', onPress: () => swipeableRef.current?.close() },
        {
          text: 'Скрий',
          onPress: async () => {
            await hideConversation(conversation.id);
            swipeableRef.current?.close();
          },
        },
      ]
    );
  };

  const renderRightActions = () => (
    <View style={styles.rightActions}>
      <TouchableOpacity
        style={[styles.actionButton, styles.hideButton]}
        onPress={handleHide}
        activeOpacity={0.8}
      >
        <EyeSlashIcon size={20} color={Colors.text.inverse} />
        <Text style={styles.actionText}>Скрий</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionButton, styles.deleteButton]}
        onPress={handleDelete}
        activeOpacity={0.8}
      >
        <TrashIcon size={20} color={Colors.text.inverse} />
        <Text style={styles.actionText}>Изтрий</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={40}
    >
      <FadeInView delay={index * 50} duration={400}>
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
      </FadeInView>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: Spacing.md,
    backgroundColor: Colors.background.glass, // Glass effect
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)', // Subtle Gold border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    fontWeight: Typography.fontWeight.bold,
    color: '#ffffff', // White name
    flex: 1,
  },
  time: {
    fontSize: Typography.fontSize.xs,
    color: Colors.green[300], // Pale Green time
    marginLeft: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: Typography.fontSize.sm,
    color: Colors.green[200], // Very Pale Green message
    flex: 1,
  },
  noMessage: {
    fontSize: Typography.fontSize.sm,
    color: Colors.green[300],
    fontStyle: 'italic',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  actionButton: {
    width: 70,
    height: '90%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    borderRadius: 12,
    marginLeft: Spacing.xs,
  },
  hideButton: {
    backgroundColor: 'rgba(75, 85, 99, 0.8)', // Semi-transparent gray
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)', // Semi-transparent red
  },
  actionText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.xs,
    marginTop: Spacing.xs,
    fontWeight: Typography.fontWeight.medium,
  },
});

