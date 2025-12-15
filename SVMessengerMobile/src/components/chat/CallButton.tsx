/**
 * Call Button Component
 * Бутон за започване на voice call в чат
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../../theme';
import { useCalls } from '../../hooks/useCalls';
import { useAuthStore } from '../../store/authStore';

interface CallButtonProps {
  conversationId: number;
  participantId: number;
  participantName: string;
  participantImageUrl?: string;
}

export const CallButton: React.FC<CallButtonProps> = ({
  conversationId,
  participantId,
  participantName,
  participantImageUrl,
}) => {
  const { startCall } = useCalls();
  const { user } = useAuthStore();

  const handleCall = () => {
    if (!user) return;
    startCall(conversationId, participantId, participantName);
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handleCall} activeOpacity={0.7}>
      <Text style={styles.icon}>📞</Text>
      <Text style={styles.label}>Обаждане</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.green[500],
    borderRadius: 20,
    gap: Spacing.xs,
  },
  icon: {
    fontSize: Typography.fontSize.base,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.inverse,
    fontWeight: Typography.fontWeight.semibold,
  },
});

