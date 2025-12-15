/**
 * Offline Indicator Component
 * Показва когато няма интернет връзка
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../../theme';
import { useUIStore } from '../../store/uiStore';

export const OfflineIndicator: React.FC = () => {
  const { networkStatus } = useUIStore();

  if (networkStatus === 'online') {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Няма интернет връзка</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.semantic.error,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  text: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
});

