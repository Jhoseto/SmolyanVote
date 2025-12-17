/**
 * Edit Message Modal Component
 * Модал за редактиране на съобщения
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Spacing, Typography } from '../../theme';
import { useMessagesStore } from '../../store/messagesStore';
import { XMarkIcon } from '../common/Icons';

interface EditMessageModalProps {
  visible: boolean;
  messageId: number;
  currentText: string;
  onClose: () => void;
}

export const EditMessageModal: React.FC<EditMessageModalProps> = ({
  visible,
  messageId,
  currentText,
  onClose,
}) => {
  const [text, setText] = useState(currentText);
  const [isSaving, setIsSaving] = useState(false);
  const { editMessage } = useMessagesStore();

  useEffect(() => {
    if (visible) {
      setText(currentText);
    }
  }, [visible, currentText]);

  const handleSave = async () => {
    if (!text.trim()) {
      Alert.alert('Грешка', 'Съобщението не може да е празно');
      return;
    }

    if (text.trim() === currentText.trim()) {
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      const result = await editMessage(messageId, text.trim());
      if (result) {
        onClose();
      } else {
        Alert.alert('Грешка', 'Неуспешно редактиране на съобщението');
      }
    } catch (error) {
      Alert.alert('Грешка', 'Неуспешно редактиране на съобщението');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Редактирай съобщение</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
              <XMarkIcon size={24} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Напиши съобщение..."
            placeholderTextColor={Colors.text.tertiary}
            multiline
            maxLength={1000}
            autoFocus
          />

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.cancelButton}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Отказ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving || !text.trim()}
              style={styles.saveButtonWrapper}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  isSaving || !text.trim()
                    ? [Colors.gray[400], Colors.gray[500]]
                    : [Colors.green[500], Colors.green[600]]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>
                  {isSaving ? 'Запазване...' : 'Запази'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    backgroundColor: Colors.background.primary,
    borderRadius: 16,
    width: '90%',
    maxWidth: 500,
    padding: Spacing.lg,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    minHeight: 100,
    maxHeight: 200,
    textAlignVertical: 'top',
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
  },
  cancelButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  saveButtonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minWidth: 100,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.inverse,
    fontWeight: Typography.fontWeight.semibold,
  },
});

