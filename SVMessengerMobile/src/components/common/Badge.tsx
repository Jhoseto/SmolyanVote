/**
 * Badge Component
 * Показва badge с число (напр. unread count)
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing } from '../../theme';

interface BadgeProps {
  count: number;
  maxCount?: number;
  size?: 'small' | 'medium';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  count,
  maxCount = 99,
  size = 'medium',
  style,
}) => {
  if (count === 0) return null;

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  return (
    <View style={[styles.badge, styles[size], style]}>
      <Text style={[styles.text, styles[`${size}Text`]]}>{displayCount}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: Colors.semantic.error,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 20,
  },
  small: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    minHeight: 16,
  },
  medium: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    minHeight: 20,
  },
  text: {
    color: Colors.text.inverse,
    fontWeight: Typography.fontWeight.bold,
  },
  smallText: {
    fontSize: Typography.fontSize.xs,
  },
  mediumText: {
    fontSize: Typography.fontSize.sm,
  },
});

