/**
 * Message Bubble Component
 * Показва едно съобщение в чата
 * Стил идентичен с web версията
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Message } from '../../types/message';
import { Colors, Typography, Spacing } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { Avatar, FadeInView } from '../common';
import { MessageMenu } from './MessageMenu';
import { EditMessageModal } from './EditMessageModal';
import { MessageStatusModal } from './MessageStatusModal';
import { CheckIcon as HeroCheckIcon } from 'react-native-heroicons/outline';
import { translateAndSaveMessage } from '../../services/api/translationService';
import { logger } from '../../utils/logger';

interface MessageBubbleProps {
  message: Message;
  conversationId: number;
  participantImageUrl?: string;
  participantName?: string;
  onReply?: (message: Message) => void;
}

const LANGUAGES = [
  { code: 'bg', name: 'Български' },
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'el', name: 'Ελληνικά' },
  { code: 'tr', name: 'Türkçe' },
];

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  conversationId,
  participantImageUrl,
  participantName,
  onReply,
}) => {
  const { user } = useAuthStore();
  const isOwnMessage = message.senderId === user?.id;
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Translation state
  const [showTranslateMenu, setShowTranslateMenu] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [translatingTo, setTranslatingTo] = useState<string | null>(null);

  const handleLongPress = () => {
    // Only show translate menu for received messages (not own messages)
    if (!isOwnMessage && message.text && message.text.length > 0) {
      setShowTranslateMenu(true);
    } else {
      setShowMenu(true);
    }
  };

  const handleTranslate = async (languageCode: string) => {
    setShowTranslateMenu(false);
    setTranslatingTo(languageCode);

    try {
      const response = await translateAndSaveMessage(message.id, languageCode);
      if (response && response.translatedText) {
        setTranslatedText(response.translatedText);
      }
    } catch (error) {
      logger.error('Translation failed:', error);
      Alert.alert('Грешка', 'Преводът не успя. Моля опитайте отново.');
    } finally {
      setTranslatingTo(null);
    }
  };

  return (
    <>
      <FadeInView duration={300} startY={10}>
        <TouchableOpacity
          style={[
            styles.container,
            isOwnMessage ? styles.ownMessage : styles.otherMessage,
          ]}
          onLongPress={handleLongPress}
          activeOpacity={0.9}
        >
          {isOwnMessage ? (
            <LinearGradient
              colors={['#064e3b', '#022c22']} // Deep Emerald (900) to Darker (950)
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.bubble,
                styles.sentBubble,
                { borderBottomRightRadius: 2 }
              ]}
            >
              {/* 3D Shine Effect */}
              <View style={styles.shine} />

              {/* Reply Preview */}
              {message.parentMessageText && (
                <View style={styles.replyPreview}>
                  <View style={[styles.replyLine, { backgroundColor: '#fff' }]} />
                  <View style={styles.replyContent}>
                    <Text style={[styles.replyText, { color: '#eee' }]} numberOfLines={2}>
                      {message.parentMessageText}
                    </Text>
                  </View>
                </View>
              )}

              <Text style={[styles.text, styles.ownText]}>
                {message.text}
              </Text>

              {message.isEdited && (
                <Text style={[styles.editedBadge, { color: '#bbf7d0' }]}>Редактирано</Text>
              )}

              <View style={styles.footer}>
                <Text style={[styles.time, { color: '#d1fae5' }]}>
                  {new Date(message.createdAt).toLocaleTimeString('bg-BG', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}
                </Text>

                <TouchableOpacity
                  onPress={() => setShowStatusModal(true)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {message.status === 'READ' ? (
                    <View style={styles.doubleCheck}>
                      <HeroCheckIcon size={14} color={'#34d399'} style={{ marginLeft: -8 }} />
                      <HeroCheckIcon size={14} color={'#34d399'} style={{ marginLeft: -8 }} />
                    </View>
                  ) : message.status === 'DELIVERED' ? (
                    <View style={styles.doubleCheck}>
                      <HeroCheckIcon size={14} color={'#d1fae5'} style={{ marginLeft: -8 }} />
                      <HeroCheckIcon size={14} color={'#d1fae5'} style={{ marginLeft: -8 }} />
                    </View>
                  ) : (
                    <HeroCheckIcon size={14} color={'#d1fae5'} />
                  )}
                </TouchableOpacity>
              </View>
            </LinearGradient>
          ) : (
            <>
              <View style={styles.avatarContainer}>
                <Avatar imageUrl={participantImageUrl} name={participantName ?? 'Потребител'} size={32} />
              </View>
              <View style={[styles.bubble, styles.receivedBubble, { borderBottomLeftRadius: 2 }]}>
                {/* Reply Preview */}
                {message.parentMessageText && (
                  <View style={styles.replyPreview}>
                    <View style={[styles.replyLine, { backgroundColor: Colors.green[600] }]} />
                    <View style={styles.replyContent}>
                      <Text style={[styles.replyText, { color: Colors.text.secondary }]} numberOfLines={2}>
                        {message.parentMessageText}
                      </Text>
                    </View>
                  </View>
                )}


                <Text style={[styles.text, styles.otherText]}>
                  {translatedText || message.text}
                </Text>

                {/* Translating Indicator */}
                {translatingTo && (
                  <View style={styles.translatingContainer}>
                    <Text style={styles.translatingText}>Translating...</Text>
                  </View>
                )}



                {message.isEdited && (
                  <Text style={[styles.editedBadge, { color: Colors.text.secondary }]}>Редактирано</Text>
                )}

                <Text style={[styles.time, { color: Colors.text.secondary }]}>
                  {new Date(message.createdAt).toLocaleTimeString('bg-BG', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}
                </Text>
              </View>
            </>
          )}
        </TouchableOpacity>
      </FadeInView>

      {/* Translation Language Selector */}
      <Modal
        visible={showTranslateMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTranslateMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTranslateMenu(false)}
        >
          <View style={styles.translationMenu}>
            <Text style={styles.translationMenuTitle}>Превод на</Text>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={styles.languageOption}
                onPress={() => handleTranslate(lang.code)}
              >
                <Text style={styles.languageOptionText}>{lang.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Message Menu (for own messages) */}
      <MessageMenu
        visible={showMenu}
        messageId={message.id}
        conversationId={conversationId}
        messageText={message.text ?? ''}
        isOwnMessage={isOwnMessage}
        onClose={() => setShowMenu(false)}
        onEdit={() => {
          setShowMenu(false);
          setShowEditModal(true);
        }}
        onReply={() => {
          setShowMenu(false);
          if (onReply) onReply(message);
        }}
      />

      {/* Edit Modal */}
      <EditMessageModal
        visible={showEditModal}
        messageId={message.id}
        currentText={message.text ?? ''}
        onClose={() => setShowEditModal(false)}
      />

      {/* Status Modal */}
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
    paddingHorizontal: Spacing.md,
    paddingVertical: 2,
    marginVertical: 2,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
    maxWidth: '85%',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    maxWidth: '85%',
  },
  avatarContainer: {
    marginRight: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 2,
  },
  bubble: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
    maxWidth: '100%',
  },
  sentBubble: {
    overflow: 'hidden',
    position: 'relative',
  },
  receivedBubble: {
    backgroundColor: Colors.background.secondary,
    flex: 1,
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  replyPreview: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 8,
  },
  replyLine: {
    width: 3,
    borderRadius: 1.5,
    marginRight: 8,
  },
  replyContent: {
    flex: 1,
  },
  replyText: {
    fontSize: 13,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  text: {
    fontSize: Typography.fontSize.base,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.normal,
  },
  ownText: {
    color: '#fff',
  },
  otherText: {
    color: Colors.text.primary,
  },
  editedBadge: {
    fontSize: 11,
    marginTop: 2,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  time: {
    fontSize: 11,
  },
  doubleCheck: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  translatingContainer: {
    marginTop: 4,
  },
  translatingText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  translationMenu: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: Spacing.md,
    minWidth: 200,
    maxWidth: '80%',
  },
  translationMenuTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  languageOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    marginVertical: 4,
    backgroundColor: Colors.background.secondary,
  },
  languageOptionText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    textAlign: 'center',
  },
});
