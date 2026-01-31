/**
 * Message Input Component
 * Input за въвеждане и изпращане на съобщения
 */

import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform, Text, Alert } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { launchImageLibrary, ImageLibraryOptions } from 'react-native-image-picker';
import { SendIcon, FaceSmileIcon, PaperClipIcon, XMarkIcon } from '../common/Icons';
import { EmojiPicker } from './EmojiPicker';
import { Colors, Typography, Spacing } from '../../theme';
import { logger } from '../../utils/logger';
import { ScaleButton } from '../common/ScaleButton'; // Import ScaleButton

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
  onFileSelect?: (file: { uri: string; type: string; name: string }) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChangeText,
  onSend,
  replyPreview,
  onCancelReply,
  onFileSelect,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const MAX_LENGTH = 3000;
  const WARNING_THRESHOLD = 2700;

  const handleEmojiSelect = (emoji: string) => {
    onChangeText(value + emoji);
    setShowEmojiPicker(false);
  };

  const handleAttachPress = () => {
    Alert.alert(
      'Избери файл',
      'Какъв тип файл искаш да изпратиш?',
      [
        {
          text: 'Снимка/Видео',
          onPress: handleMediaPick,
        },
        {
          text: 'Отказ',
          style: 'cancel',
        },
      ]
    );
  };

  const handleMediaPick = async () => {
    const options: ImageLibraryOptions = {
      mediaType: 'mixed',
      quality: 0.8,
      includeBase64: false,
    };

    try {
      const result = await launchImageLibrary(options);

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        Alert.alert('Грешка', 'Неуспешно избиране на файл');
        logger.error('ImagePicker Error:', result.errorMessage);
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        if (asset.uri && asset.type && asset.fileName) {
          const file = {
            uri: asset.uri,
            type: asset.type,
            name: asset.fileName,
          };

          // Call callback if provided
          if (onFileSelect) {
            onFileSelect(file);
          } else {
            // Fallback: Show alert that file attachments need backend support
            Alert.alert(
              'File Attachments',
              'Файловете ще бъдат изпратени след имплементация на backend поддръжка.'
            );
          }
        }
      }
    } catch (error) {
      logger.error('Error picking image:', error);
      Alert.alert('Грешка', 'Неуспешно избиране на файл');
    }
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
        {/* Attach Button */}
        <ScaleButton
          onPress={handleAttachPress}
          style={styles.iconButton}
        >
          <PaperClipIcon size={22} color="#e5e7eb" />
        </ScaleButton>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder={replyPreview ? "Напиши отговор..." : "Напиши съобщение..."}
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            multiline
            maxLength={MAX_LENGTH}
            blurOnSubmit={false}
            returnKeyType="default"
          />
        </View>

        {/* Emoji Button */}
        <ScaleButton
          onPress={() => setShowEmojiPicker(true)}
          style={styles.iconButton}
        >
          <FaceSmileIcon size={22} color="#e5e7eb" />
        </ScaleButton>

        {/* Send Button */}
        <ScaleButton
          onPress={onSend}
          disabled={!value.trim() || value.length > MAX_LENGTH}
          style={styles.sendButtonWrapper}
        >
          <LinearGradient
            colors={(value.trim() && value.length <= MAX_LENGTH)
              ? [Colors.green[500], Colors.green[600]]
              : [Colors.gray[400], Colors.gray[500]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.sendButton, (!value.trim() || value.length > MAX_LENGTH) && styles.sendButtonDisabled]}
          >
            <SendIcon size={20} color={Colors.text.inverse} />
          </LinearGradient>
        </ScaleButton>

        {/* Character Counter */}
        {value.length > 0 && (
          <Text
            style={[
              styles.charCounter,
              value.length >= WARNING_THRESHOLD && styles.charCounterWarning,
              value.length > MAX_LENGTH && styles.charCounterError,
            ]}
          >
            {value.length}/{MAX_LENGTH}
          </Text>
        )}
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
    backgroundColor: 'rgba(2, 44, 34, 0.85)', // Glassy Emerald Dark
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.3)', // Gold border
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Glassy input
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.base,
    color: '#ffffff', // White text
    maxHeight: 100,
    minHeight: 44,
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
    shadowColor: Colors.green[500], // Keep shadow
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
    backgroundColor: 'rgba(2, 44, 34, 0.95)', // Darker Emerald
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.3)',
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
    color: '#fbbf24', // Gold
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
  warningContainer: {
    position: 'absolute',
    left: Spacing.md,
    bottom: Spacing.xs,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  warningText: {
    fontSize: Typography.fontSize.xs,
    color: '#ffffff',
    fontWeight: Typography.fontWeight.bold,
  },
  charCounter: {
    position: 'absolute',
    right: Spacing.md,
    bottom: Spacing.xs,
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  charCounterWarning: {
    color: '#f59e0b',
  },
  charCounterError: {
    color: '#ef4444',
    fontWeight: Typography.fontWeight.bold,
  },
});

