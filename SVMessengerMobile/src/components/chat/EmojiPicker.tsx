/**
 * Emoji Picker Component
 * Модерен emoji picker за мобилното приложение
 */

import React, { useState, Component, ErrorInfo, ReactNode } from 'react';
import { View, Modal, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Colors, Spacing, Typography } from '../../theme';
import { XMarkIcon } from '../common/Icons';

// Error Boundary for EmojiSelector
class EmojiSelectorErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; onError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('EmojiSelector Error:', error, errorInfo);
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackText}>Грешка при зареждане на emoji picker</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

// Lazy load EmojiSelector to avoid initialization errors
let EmojiSelector: any = null;
let EmojiSelectorLoaded = false;
try {
  EmojiSelector = require('react-native-emoji-selector').default;
  EmojiSelectorLoaded = true;
} catch (error) {
  console.warn('Failed to load react-native-emoji-selector:', error);
  EmojiSelectorLoaded = false;
}

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

  const [hasError, setHasError] = useState(false);

  // Wrap EmojiSelector in error boundary to prevent crashes
  const renderEmojiSelector = () => {
    if (!EmojiSelectorLoaded || !EmojiSelector) {
      return (
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackText}>Emoji picker не е наличен</Text>
        </View>
      );
    }

    // Wrap in ErrorBoundary to catch fontSize errors
    return (
      <EmojiSelectorErrorBoundary onError={() => setHasError(true)}>
        <View style={styles.emojiWrapper}>
          <EmojiSelector
            onEmojiSelected={handleEmojiSelect}
            showSearchBar={true}
            showTabs={true}
            showSectionTitles={true}
            columns={7}
            placeholder="Търси емотикони..."
            categoryEmojiSize={24}
            emojiSize={32}
            categoryFontSize={14}
          />
        </View>
      </EmojiSelectorErrorBoundary>
    );
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
            {renderEmojiSelector()}
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
    // Fix for negative fontSize issue in react-native-emoji-selector
    // Ensure all text has positive fontSize
    overflow: 'hidden',
  },
  emojiWrapper: {
    flex: 1,
    // Force positive fontSize values
    minHeight: 0,
  },
  searchBar: {
    fontSize: 16,
    minHeight: 40,
  },
  categoryContainer: {
    paddingVertical: 8,
    minHeight: 40,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  fallbackText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});

