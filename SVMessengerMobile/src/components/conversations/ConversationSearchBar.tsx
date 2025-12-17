/**
 * Conversation Search Bar
 * Search bar за търсене в списъка с разговори
 */

import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { MagnifyingGlassIcon, XMarkIcon } from '../common/Icons';
import { Colors, Spacing, Typography } from '../../theme';

interface ConversationSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
}

export const ConversationSearchBar: React.FC<ConversationSearchBarProps> = ({
  searchQuery,
  onSearchChange,
  onClearSearch,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <MagnifyingGlassIcon size={20} color={Colors.text.secondary} style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Търси разговори..."
          placeholderTextColor={Colors.text.tertiary}
          value={searchQuery}
          onChangeText={onSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={onClearSearch} style={styles.clearButton} activeOpacity={0.7}>
            <XMarkIcon size={20} color={Colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    paddingVertical: 0,
  },
  clearButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
});

