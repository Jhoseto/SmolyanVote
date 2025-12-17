/**
 * Emoji Picker Component
 * Модерен emoji picker за мобилното приложение
 */

import React from 'react';
import { View, Modal, StyleSheet, TouchableOpacity, Text } from 'react-native';
import EmojiSelector from 'react-native-emoji-selector';
import { Colors, Spacing, Typography } from '../../theme';
import { XMarkIcon } from '../common/Icons';

interface EmojiPickerProps {
  visible: boolean;
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  visible,
  onEmojiSelect,
  onClose,
}) => {
  const handleEmojiSelect = (emoji: string) => {
    onEmojiSelect(emoji);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Емотикони</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
              <XMarkIcon size={24} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Emoji Selector */}
          <View style={styles.emojiContainer}>
            <EmojiSelector
              onEmojiSelected={handleEmojiSelect}
              showSearchBar={true}
              showTabs={true}
              showSectionTitles={true}
              columns={7}
              placeholder="Търси емотикони..."
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '70%',
    maxHeight: 600,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  emojiContainer: {
    flex: 1,
  },
});

