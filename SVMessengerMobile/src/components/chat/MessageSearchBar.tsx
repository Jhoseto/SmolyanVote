/**
 * Message Search Bar Component
 * Search bar за търсене в съобщенията
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
} from 'react-native';
import { Colors, Spacing, Typography } from '../../theme';
import { XMarkIcon, MagnifyingGlassIcon } from '../common/Icons';

interface MessageSearchBarProps {
  visible: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClose: () => void;
  resultCount?: number;
  currentIndex?: number;
  onNext?: () => void;
  onPrevious?: () => void;
}

export const MessageSearchBar: React.FC<MessageSearchBarProps> = ({
  visible,
  searchQuery,
  onSearchChange,
  onClose,
  resultCount = 0,
  currentIndex = 0,
  onNext,
  onPrevious,
}) => {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <MagnifyingGlassIcon size={20} color={Colors.text.secondary} />
        <TextInput
          style={styles.input}
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Търси в разговора..."
          placeholderTextColor={Colors.text.tertiary}
          autoFocus
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')} activeOpacity={0.7}>
            <XMarkIcon size={20} color={Colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>

      {searchQuery.length > 0 && resultCount > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            {currentIndex + 1} от {resultCount}
          </Text>
          <View style={styles.navigationButtons}>
            <TouchableOpacity
              onPress={onPrevious}
              style={styles.navButton}
              activeOpacity={0.7}
              disabled={currentIndex === 0}
            >
              <Text style={[styles.navButtonText, currentIndex === 0 && styles.navButtonDisabled]}>
                ↑
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onNext}
              style={styles.navButton}
              activeOpacity={0.7}
              disabled={currentIndex === resultCount - 1}
            >
              <Text style={[styles.navButtonText, currentIndex === resultCount - 1 && styles.navButtonDisabled]}>
                ↓
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {searchQuery.length > 0 && resultCount === 0 && (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>Няма намерени резултати</Text>
        </View>
      )}

      <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
        <Text style={styles.closeButtonText}>Затвори</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    padding: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  resultsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  resultsText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  navButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
  },
  navButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.green[500],
    fontWeight: Typography.fontWeight.bold,
  },
  navButtonDisabled: {
    color: Colors.text.tertiary,
    opacity: 0.5,
  },
  noResultsContainer: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  noResultsText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
  },
  closeButton: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.green[500],
    fontWeight: Typography.fontWeight.medium,
  },
});

