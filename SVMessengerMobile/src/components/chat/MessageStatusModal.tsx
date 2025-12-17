/**
 * Message Status Modal
 * Модал за показване на детайли за статуса на съобщението (delivered, read)
 */

import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../../theme';
import { Message } from '../../types/message';
import { XMarkIcon } from '../common/Icons';

interface MessageStatusModalProps {
  visible: boolean;
  message: Message | null;
  onClose: () => void;
}

export const MessageStatusModal: React.FC<MessageStatusModalProps> = ({
  visible,
  message,
  onClose,
}) => {
  if (!message || !visible) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Не е налично';
    const date = new Date(dateString);
    return date.toLocaleString('bg-BG', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusText = () => {
    if (message.isRead) {
      return 'Прочетено';
    } else if (message.isDelivered) {
      return 'Доставено';
    } else {
      return 'Изпратено';
    }
  };

  const getStatusColor = () => {
    if (message.isRead) {
      return Colors.green[500];
    } else if (message.isDelivered) {
      return Colors.text.secondary;
    } else {
      return Colors.text.tertiary;
    }
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1}>
        <View style={styles.container} onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Статус на съобщението</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
              <XMarkIcon size={24} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.statusRow}>
              <Text style={styles.label}>Статус:</Text>
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
            </View>

            {message.deliveredAt && (
              <View style={styles.statusRow}>
                <Text style={styles.label}>Доставено:</Text>
                <Text style={styles.value}>{formatDate(message.deliveredAt)}</Text>
              </View>
            )}

            {message.readAt && (
              <View style={styles.statusRow}>
                <Text style={styles.label}>Прочетено:</Text>
                <Text style={styles.value}>{formatDate(message.readAt)}</Text>
              </View>
            )}

            <View style={styles.statusRow}>
              <Text style={styles.label}>Изпратено:</Text>
              <Text style={styles.value}>{formatDate(message.createdAt)}</Text>
            </View>

            {message.isEdited && message.editedAt && (
              <View style={styles.statusRow}>
                <Text style={styles.label}>Редактирано:</Text>
                <Text style={styles.value}>{formatDate(message.editedAt)}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: Colors.background.primary,
    borderRadius: 16,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
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
  content: {
    padding: Spacing.lg,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  label: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  statusText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  value: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
});

