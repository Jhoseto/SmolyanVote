/**
 * Call Button Component
 * Бутон за започване на voice call в чат
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../../theme';
import { useCalls } from '../../hooks/useCalls';
import { useAuthStore } from '../../store/authStore';
import { TelephoneIcon } from '../common/Icons';

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
    // CRITICAL FIX: Match arguments with useCalls hook: 
    // (participantId, participantName, participantImageUrl, isVideo, existingConversationId)
    startCall(participantId, participantName, participantImageUrl, false, conversationId);
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handleCall} activeOpacity={0.7}>
      <TelephoneIcon size={20} color={Colors.text.inverse} />
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
  label: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.inverse,
    fontWeight: Typography.fontWeight.semibold,
  },
});

