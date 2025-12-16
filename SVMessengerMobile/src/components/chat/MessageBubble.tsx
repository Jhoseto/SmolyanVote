/**
 * Message Bubble Component
 * Показва едно съобщение в чата
 * Стил идентичен с web версията
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
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
      {isOwnMessage ? (
        // Sent message - синкав градиент (като web версията)
        <LinearGradient
          colors={['#f0f9ff', '#e0f2fe', '#bae6fd', '#7dd3fc']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.bubble, styles.ownBubble]}
        >
          <Text style={[styles.text, styles.ownText]}>
            {message.text}
          </Text>
          <View style={styles.footer}>
            <Text style={styles.time}>
              {new Date(message.createdAt).toLocaleTimeString('bg-BG', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            <View style={styles.status}>
              {!message.isDelivered ? (
                // 1 сива лястовица: SENT (не е delivered)
                <Text style={styles.statusIcon}>✓</Text>
              ) : message.isDelivered && !message.isRead ? (
                // 2 сиви лястовици: DELIVERED (delivered, но не е read)
                <Text style={styles.statusIcon}>✓✓</Text>
              ) : (
                // 2 зелени лястовици: READ (delivered и read)
                <Text style={[styles.statusIcon, styles.readIcon]}>✓✓</Text>
              )}
            </View>
          </View>
        </LinearGradient>
      ) : (
        // Received message - сив градиент (като web версията)
        <LinearGradient
          colors={['#f8fafc', '#f1f5f9', '#e2e8f0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.bubble, styles.otherBubble]}
        >
          <Text style={[styles.text, styles.otherText]}>
            {message.text}
          </Text>
          <View style={styles.footer}>
            <Text style={styles.time}>
              {new Date(message.createdAt).toLocaleTimeString('bg-BG', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </LinearGradient>
      )}
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
    paddingVertical: 12, // var(--svm-space-3)
    paddingHorizontal: 16, // var(--svm-space-4)
    borderRadius: 20,
    // Shadows като web версията
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2, // Android shadow
    borderWidth: 1,
  },
  ownBubble: {
    borderBottomRightRadius: 6,
    borderColor: 'rgba(34, 197, 94, 0.2)', // rgba(34, 197, 94, 0.2)
    // Sent shadow: 0 2px 8px rgba(34, 197, 94, 0.15)
    shadowColor: '#22c55e',
    shadowOpacity: 0.15,
  },
  otherBubble: {
    borderBottomLeftRadius: 6,
    borderColor: 'rgba(255, 255, 255, 0.4)', // rgba(255, 255, 255, 0.4)
    // Received shadow: 0 2px 8px rgba(0, 0, 0, 0.08)
    shadowColor: '#000',
    shadowOpacity: 0.08,
  },
  text: {
    fontSize: 13, // var(--svm-font-size-sm)
    lineHeight: 18.2, // 1.4 * 13
    wordWrap: 'break-word',
  },
  ownText: {
    color: '#1f2937', // --svm-bubble-sent-text: #1f2937
  },
  otherText: {
    color: '#374151', // --svm-bubble-received-text: #374151
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    justifyContent: 'flex-end',
  },
  time: {
    fontSize: 8, // 8px като web версията
    color: '#6b7280',
    opacity: 0.8,
    marginRight: 2,
    fontWeight: '400',
    lineHeight: 9.6, // 1.2 * 8
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  statusIcon: {
    fontSize: 8, // 8px като web версията
    color: '#6b7280', // Сиво по default
    fontWeight: '400',
    lineHeight: 9.6, // 1.2 * 8
  },
  readIcon: {
    color: '#ffffff', // Бяло за прочетени съобщения (като web версията)
  },
});

