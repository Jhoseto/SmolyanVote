/**
 * Message Input Component
 * Input за въвеждане и изпращане на съобщения
 */

import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SendIcon } from '../common/Icons';
import { Colors, Typography, Spacing } from '../../theme';

interface MessageInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChangeText,
  onSend,
}) => {

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder="Напиши съобщение..."
          placeholderTextColor={Colors.text.tertiary}
          multiline
          maxLength={1000}
        />
      </View>
      <TouchableOpacity
        onPress={onSend}
        disabled={!value.trim()}
        activeOpacity={0.8}
        style={styles.sendButtonWrapper}
      >
        <LinearGradient
          colors={value.trim() 
            ? [Colors.green[500], Colors.green[600]]
            : [Colors.gray[400], Colors.gray[500]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.sendButton, !value.trim() && styles.sendButtonDisabled]}
        >
          <SendIcon size={20} color={Colors.text.inverse} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    alignItems: 'flex-end',
    paddingBottom: Platform.OS === 'ios' ? Spacing.lg : Spacing.md,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputWrapper: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 24,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    maxHeight: 100,
    minHeight: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
    shadowColor: Colors.green[500],
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
});

