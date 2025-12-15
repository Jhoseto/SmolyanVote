/**
 * Message Bubble Component
 * Показва едно съобщение в чата
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Message } from '../../types/message';
import { Colors, Typography, Spacing } from '../../theme';
import { useAuthStore } from '../../store/authStore';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { user } = useAuthStore();
  const isOwnMessage = message.senderId === user?.id;

  return (
    <View
      style={[
        styles.container,
        isOwnMessage ? styles.ownMessage : styles.otherMessage,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble,
        ]}
      >
        <Text
          style={[
            styles.text,
            isOwnMessage ? styles.ownText : styles.otherText,
          ]}
        >
          {message.text}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.time}>
            {new Date(message.createdAt).toLocaleTimeString('bg-BG', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
          {isOwnMessage && (
            <View style={styles.status}>
              {message.isDelivered && (
                <Text style={styles.statusIcon}>✓✓</Text>
              )}
              {message.isRead && (
                <Text style={[styles.statusIcon, styles.readIcon]}>✓✓</Text>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.xs,
    flexDirection: 'row',
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    padding: Spacing.md,
    borderRadius: 16,
  },
  ownBubble: {
    backgroundColor: Colors.green[500],
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: Colors.background.primary,
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: Typography.fontSize.base,
  },
  ownText: {
    color: Colors.text.inverse,
  },
  otherText: {
    color: Colors.text.primary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    justifyContent: 'flex-end',
  },
  time: {
    fontSize: Typography.fontSize.xs,
    opacity: 0.7,
    marginRight: Spacing.xs,
  },
  status: {
    flexDirection: 'row',
  },
  statusIcon: {
    fontSize: Typography.fontSize.xs,
    opacity: 0.7,
  },
  readIcon: {
    color: Colors.semantic.info,
  },
});

