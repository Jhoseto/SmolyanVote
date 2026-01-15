/**
 * Typing Indicator Component
 * Premium animated typing indicator
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Colors, Typography, Spacing } from '../../theme';

interface TypingIndicatorProps {
  name: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ name }) => {
  const dot1Y = useRef(new Animated.Value(0)).current;
  const dot2Y = useRef(new Animated.Value(0)).current;
  const dot3Y = useRef(new Animated.Value(0)).current;

  const startAnimation = (value: Animated.Value, delay: number) => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(value, {
          toValue: -4, // Jump up 4px
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: 0,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  useEffect(() => {
    startAnimation(dot1Y, 0);
    startAnimation(dot2Y, 150);
    startAnimation(dot3Y, 300);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={styles.container}>
      <View style={styles.indicator}>
        <Animated.View style={[styles.dot, { transform: [{ translateY: dot1Y }], opacity: 0.6 }]} />
        <Animated.View style={[styles.dot, { transform: [{ translateY: dot2Y }], opacity: 0.8 }]} />
        <Animated.View style={[styles.dot, { transform: [{ translateY: dot3Y }], opacity: 1 }]} />
      </View>
      <Text style={styles.text}>{name} пише...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.sm,
    gap: 4,
    height: 16, // Fixed height for bounce
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.green[500],
  },
  text: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontStyle: 'italic',
    fontWeight: Typography.fontWeight.medium,
  },
});
