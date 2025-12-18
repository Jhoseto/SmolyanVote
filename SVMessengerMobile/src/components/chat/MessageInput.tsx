/**
 * Message Input Component
 * Input за въвеждане и изпращане на съобщения
 */

import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SendIcon, FaceSmileIcon, PaperClipIcon, XMarkIcon } from '../common/Icons';
import { EmojiPicker } from './EmojiPicker';
import { Colors, Typography, Spacing } from '../../theme';

interface ReplyPreview {
  messageId: number;
  text: string;
  senderName: string;
}

interface MessageInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  replyPreview?: ReplyPreview | null;
  onCancelReply?: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChangeText,
  onSend,
  replyPreview,
  onCancelReply,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleEmojiSelect = (emoji: string) => {
    onChangeText(value + emoji);
    setShowEmojiPicker(false);
  };

  const handleAttachPress = () => {
    // TODO: File attachments placeholder
    console.log('File attachments - coming soon');
  };

  return (
    <>
      {/* Reply Preview */}
      {replyPreview && (
        <View style={styles.replyPreviewContainer}>
          <View style={styles.replyPreviewContent}>
            <View style={styles.replyTextContainer}>
              <Text style={styles.replyAuthor} numberOfLines={1}>
                Отговор на {replyPreview.senderName}
              </Text>
              <Text style={styles.replyText} numberOfLines={1}>
                {replyPreview.text}
              </Text>
            </View>
            {onCancelReply && (
              <TouchableOpacity
                onPress={onCancelReply}
                style={styles.cancelReplyButton}
                activeOpacity={0.7}
              >
                <XMarkIcon size={18} color={Colors.text.secondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <View style={styles.container}>
        {/* Attach Button (placeholder) */}
        <TouchableOpacity
          onPress={handleAttachPress}
          style={styles.iconButton}
          activeOpacity={0.7}
        >
          <PaperClipIcon size={22} color={Colors.text.secondary} />
        </TouchableOpacity>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder={replyPreview ? "Напиши отговор..." : "Напиши съобщение..."}
            placeholderTextColor={Colors.text.tertiary}
            multiline
            maxLength={1000}
          />
        </View>

        {/* Emoji Button */}
        <TouchableOpacity
          onPress={() => setShowEmojiPicker(true)}
          style={styles.iconButton}
          activeOpacity={0.7}
        >
          <FaceSmileIcon size={22} color={Colors.text.secondary} />
        </TouchableOpacity>

        {/* Send Button */}
        <TouchableOpacity
          onPress={onSend}
          disabled={!value.trim()}
          activeOpacity={0.8}
          style={styles.sendButtonWrapper}
        >
          <LinearGradient
            colors={value.trim() 
              ? [Colors.green[500], Colors.green[600]]
              : [Colors.gray[400], Colors.gray[500]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.sendButton, !value.trim() && styles.sendButtonDisabled]}
          >
            <SendIcon size={20} color={Colors.text.inverse} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Emoji Picker Modal */}
      <EmojiPicker
        visible={showEmojiPicker}
        onEmojiSelect={handleEmojiSelect}
        onClose={() => setShowEmojiPicker(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    alignItems: 'flex-end',
    paddingBottom: Platform.OS === 'ios' ? Spacing.lg : Spacing.md,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.xs,
  },
  inputWrapper: {
    flex: 1,
    marginRight: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 24,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    maxHeight: 100,
    minHeight: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sendButtonWrapper: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.green[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    opacity: 0.4,
    shadowOpacity: 0,
    elevation: 0,
  },
  replyPreviewContainer: {
    backgroundColor: Colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  replyPreviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    borderRadius: 8,
    padding: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.green[500],
  },
  replyTextContainer: {
    flex: 1,
  },
  replyAuthor: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  replyText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
  },
  cancelReplyButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
});

