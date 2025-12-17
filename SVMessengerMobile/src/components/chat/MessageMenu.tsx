/**
 * Message Menu Component
 * Long press меню за съобщения (Edit, Delete, etc.)
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Colors, Spacing, Typography } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useMessagesStore } from '../../store/messagesStore';

interface MessageMenuProps {
  visible: boolean;
  messageId: number;
  conversationId: number;
  messageText: string;
  isOwnMessage: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onReply?: () => void;
}

export const MessageMenu: React.FC<MessageMenuProps> = ({
  visible,
  messageId,
  conversationId,
  messageText,
  isOwnMessage,
  onClose,
  onEdit,
  onReply,
}) => {
  const { user } = useAuthStore();
  const { editMessage, deleteMessage } = useMessagesStore();

  const handleEdit = () => {
    onClose();
    if (onEdit) {
      onEdit();
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Изтриване на съобщение',
      'Сигурен ли си, че искаш да изтриеш това съобщение?',
      [
        {
          text: 'Отказ',
          style: 'cancel',
        },
        {
          text: 'Изтрий',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteMessage(messageId, conversationId);
            if (success) {
              onClose();
            } else {
              Alert.alert('Грешка', 'Неуспешно изтриване на съобщението');
            }
          },
        },
      ]
    );
  };

  const handleReply = () => {
    onClose();
    if (onReply) {
      onReply();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.menu}>
          {/* Reply - за всички съобщения */}
          {onReply && (
            <>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleReply}
                activeOpacity={0.7}
              >
                <Text style={styles.menuItemText}>Отговори</Text>
              </TouchableOpacity>
              {isOwnMessage && <View style={styles.separator} />}
            </>
          )}

          {/* Edit и Delete - само за собствени съобщения */}
          {isOwnMessage && (
            <>
              {onEdit && (
                <>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={handleEdit}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.menuItemText}>Редактирай</Text>
                  </TouchableOpacity>
                  <View style={styles.separator} />
                </>
              )}

              <TouchableOpacity
                style={[styles.menuItem, styles.menuItemDanger]}
                onPress={handleDelete}
                activeOpacity={0.7}
              >
                <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>
                  Изтрий
                </Text>
              </TouchableOpacity>
            </>
          )}
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
  menu: {
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    minWidth: 200,
    paddingVertical: Spacing.xs,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  menuItem: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  menuItemDanger: {
    // No special styling needed
  },
  menuItemText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  menuItemTextDanger: {
    color: Colors.semantic.error,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: Spacing.xs,
  },
});

