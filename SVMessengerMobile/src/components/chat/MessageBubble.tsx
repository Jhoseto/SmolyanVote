/**
 * Message Bubble Component
 * Показва едно съобщение в чата
 * Стил идентичен с web версията
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Message } from '../../types/message';
import { Colors, Typography, Spacing } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { Avatar } from '../common';
import { MessageMenu } from './MessageMenu';
import { EditMessageModal } from './EditMessageModal';
import { MessageStatusModal } from './MessageStatusModal';

interface MessageBubbleProps {
  message: Message;
  participantImageUrl?: string;
  participantName?: string;
  onReply?: (message: Message) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message,
  participantImageUrl,
  participantName,
  onReply,
}) => {
  const { user } = useAuthStore();
  const isOwnMessage = message.senderId === user?.id;
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const handleLongPress = () => {
    setShowMenu(true);
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.container,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
        onLongPress={handleLongPress}
        activeOpacity={0.9}
      >
      {isOwnMessage ? (
        // Sent message - синкав градиент
        <LinearGradient
          colors={['#e0f2fe', '#bae6fd', '#7dd3fc']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.bubble, styles.ownBubble]}
        >
          {/* Reply Preview */}
          {message.parentMessageText && (
            <View style={styles.replyPreview}>
              <View style={styles.replyLine} />
              <View style={styles.replyContent}>
                <Text style={styles.replyText} numberOfLines={2}>
                  {message.parentMessageText}
                </Text>
              </View>
            </View>
          )}
          <Text style={[styles.text, styles.ownText]}>
            {message.text}
          </Text>
          {message.isEdited && (
            <Text style={styles.editedBadge}>Редактирано</Text>
          )}
          <View style={styles.footer}>
            <Text style={styles.time}>
              {new Date(message.createdAt).toLocaleTimeString('bg-BG', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            <TouchableOpacity
              onPress={() => setShowStatusModal(true)}
              activeOpacity={0.7}
              style={styles.status}
            >
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
            </TouchableOpacity>
          </View>
        </LinearGradient>
      ) : (
        // Received message - сив градиент с avatar
        <View style={styles.otherMessageContainer}>
          <Avatar
            imageUrl={participantImageUrl}
            name={participantName || 'User'}
            size={32}
            style={styles.messageAvatar}
          />
          <LinearGradient
            colors={['#ffffff', '#f8fafc', '#f1f5f9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.bubble, styles.otherBubble]}
          >
            {/* Reply Preview */}
            {message.parentMessageText && (
              <View style={styles.replyPreview}>
                <View style={[styles.replyLine, styles.replyLineOther]} />
                <View style={styles.replyContent}>
                  <Text style={styles.replyText} numberOfLines={2}>
                    {message.parentMessageText}
                  </Text>
                </View>
              </View>
            )}
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
        </View>
      )}
      </TouchableOpacity>

      {/* Message Menu */}
      <MessageMenu
        visible={showMenu}
        messageId={message.id}
        conversationId={message.conversationId}
        messageText={message.text}
        isOwnMessage={isOwnMessage}
        onClose={() => setShowMenu(false)}
        onEdit={() => setShowEditModal(true)}
        onReply={() => onReply?.(message)}
      />

      {/* Edit Message Modal */}
      {showEditModal && (
        <EditMessageModal
          visible={showEditModal}
          messageId={message.id}
          currentText={message.text}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {/* Message Status Modal */}
      <MessageStatusModal
        visible={showStatusModal}
        message={message}
        onClose={() => setShowStatusModal(false)}
      />
    </>
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
  otherMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.xs,
    maxWidth: '85%',
  },
  messageAvatar: {
    marginBottom: 2,
  },
  bubble: {
    maxWidth: '75%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
  },
  ownBubble: {
    borderBottomRightRadius: 6,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    shadowColor: '#22c55e',
    shadowOpacity: 0.15,
  },
  otherBubble: {
    borderBottomLeftRadius: 6,
    borderColor: 'rgba(255, 255, 255, 0.4)',
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
  editedBadge: {
    fontSize: 10,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 2,
  },
  replyPreview: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  replyLine: {
    width: 3,
    backgroundColor: Colors.green[500],
    borderRadius: 2,
    marginRight: 8,
  },
  replyLineOther: {
    backgroundColor: Colors.gray[400],
  },
  replyContent: {
    flex: 1,
  },
  replyAuthor: {
    fontSize: 11,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  replyText: {
    fontSize: 12,
    color: Colors.text.tertiary,
    lineHeight: 16,
  },
});

