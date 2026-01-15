import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing, Modal, TouchableWithoutFeedback, Platform, Vibration, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, ScaleButton } from '../common';
import { ArrowLeftIcon, TelephoneIcon, EllipsisVerticalIcon, SearchIcon, BellSlashIcon } from '../common/Icons';
import { Colors, Typography, Spacing } from '../../theme';
import { useCalls } from '../../hooks/useCalls';
import { useAuthStore } from '../../store/authStore';
import { useConversationsStore } from '../../store/conversationsStore'; // Import Store

interface ChatHeaderProps {
  participantName: string;
  participantImageUrl?: string;
  participantId: number;
  conversationId: number;
  isOnline?: boolean;
  mutedUntil?: string; // New prop
  onBack?: () => void;
  onSearchPress?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  participantName,
  participantImageUrl,
  participantId,
  conversationId,
  isOnline = false,
  mutedUntil,
  onBack,
  onSearchPress,
}) => {
  const { startCall } = useCalls();
  const { user } = useAuthStore();
  const { muteConversation } = useConversationsStore(); // Use store action
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Update countdown if muted
  useEffect(() => {
    if (!mutedUntil) {
      setTimeRemaining('');
      return;
    }

    const updateTime = () => {
      const now = new Date();
      const end = new Date(mutedUntil);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('');
        muteConversation(conversationId, null); // Auto-unmute locally
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeRemaining(`${hours}ч ${minutes}м`);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [mutedUntil, conversationId, muteConversation]);

  // Handle Mute Action
  const handleMute = () => {
    Vibration.vibrate(10);
    closeMenu();
    Alert.alert(
      "Спиране на известията",
      "За колко време искате да спрете известията?",
      [
        {
          text: "1 Час",
          onPress: () => {
            const date = new Date();
            date.setHours(date.getHours() + 1);
            muteConversation(conversationId, date.toISOString());
          }
        },
        {
          text: "8 Часа",
          onPress: () => {
            const date = new Date();
            date.setHours(date.getHours() + 8);
            muteConversation(conversationId, date.toISOString());
          }
        },
        {
          text: "24 Часа",
          onPress: () => {
            const date = new Date();
            date.setHours(date.getHours() + 24);
            muteConversation(conversationId, date.toISOString());
          }
        },
        { text: "Отказ", style: "cancel" }
      ]
    );
  };

  // Simple pulse animation за онлайн статус
  useEffect(() => {
    if (isOnline) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isOnline]);

  const handleVoiceCall = () => {
    Vibration.vibrate(15);
    if (!user) return;
    startCall(participantId, participantName, participantImageUrl, false, conversationId);
  };

  const toggleMenu = () => {
    Vibration.vibrate(10);
    setIsMenuVisible(!isMenuVisible);
  };
  const closeMenu = () => setIsMenuVisible(false);

  const handleSearch = () => {
    Vibration.vibrate(10);
    closeMenu();
    if (onSearchPress) onSearchPress();
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.glassContainer}>
        <View style={styles.container}>
          {/* Back Button */}
          {onBack && (
            <ScaleButton onPress={onBack} style={styles.backButton}>
              <ArrowLeftIcon size={24} color={Colors.text.inverse} />
            </ScaleButton>
          )}

          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <Avatar
              imageUrl={participantImageUrl}
              name={participantName}
              size={40}
              isOnline={isOnline}
              style={styles.avatar}
            />
          </View>

          {/* Name */}
          <View style={styles.nameContainer}>
            <Text style={styles.name} numberOfLines={1}>
              {participantName}
            </Text>
            {isOnline && (
              <View style={styles.onlineContainer}>
                <Animated.View
                  style={[
                    styles.onlineDot,
                    {
                      transform: [{ scale: pulseAnim }],
                    },
                  ]}
                />
                <Text style={styles.onlineText}>
                  Онлайн
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {/* Voice Call Button - Simple Icon */}
            <ScaleButton
              onPress={handleVoiceCall}
              style={styles.simpleActionButton}
            >
              <TelephoneIcon size={24} color={Colors.text.inverse} />
            </ScaleButton>

            {/* Menu Button (Three Dots) */}
            <ScaleButton
              onPress={toggleMenu}
              style={styles.simpleActionButton}
            >
              <EllipsisVerticalIcon size={24} color={Colors.text.inverse} />
            </ScaleButton>
          </View>
        </View>

      </View>

      {/* Muted Banner - Shows ONLY if muted */}
      {
        mutedUntil && timeRemaining ? (
          <View style={styles.mutedBanner}>
            <BellSlashIcon size={14} color={Colors.text.primary} />
            <Text style={styles.mutedText}>
              Заглушено: остават {timeRemaining}
            </Text>
          </View>
        ) : null
      }

      {/* Menu Overlay */}
      <Modal
        visible={isMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <TouchableWithoutFeedback onPress={closeMenu}>
          <View style={styles.modalOverlay}>
            <View style={styles.menuContainer}>
              <TouchableOpacity onPress={handleSearch} style={styles.menuItem}>
                <SearchIcon size={20} color={Colors.text.primary} />
                <Text style={styles.menuText}>Търсене</Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity onPress={handleMute} style={styles.menuItem}>
                <BellSlashIcon size={20} color={Colors.text.primary} />
                <Text style={styles.menuText}>Заглуши</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView >
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: 'transparent',
    zIndex: 100,
  },
  glassContainer: {
    backgroundColor: 'rgba(2, 44, 34, 0.6)', // Semi-transparent deep emerald
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.3)', // Gold border
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  gradient: {
    // Removed
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 56,
  },
  backButton: {
    marginRight: Spacing.sm,
    padding: 4,
  },
  avatarContainer: {
    marginRight: Spacing.md,
  },
  avatar: {
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  nameContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8, // Avoid overlapping icons
  },
  name: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: '#ffffff', // Explicitly White
    marginBottom: 0,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  onlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ade80', // Brighter green for dot
    marginRight: 4,
  },
  onlineText: {
    fontSize: Typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: Typography.fontWeight.medium,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  simpleActionButton: {
    padding: 8,
    borderRadius: 20,
    // No background, no border - plain icon
  },

  // Menu Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)', // Subtle dim
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60, // approximate position below header
    paddingRight: 10,
  },
  menuContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Glass effect
    borderRadius: 16,
    paddingVertical: 8,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2, // Stronger shadow
    shadowRadius: 20,
    elevation: 10,
    marginTop: Platform.OS === 'android' ? 10 : 45,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)', // Subtle border
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14, // Taller touch target
    paddingHorizontal: 20,
  },
  menuText: {
    marginLeft: 14,
    fontSize: 16, // Slightly larger font
    color: Colors.text.primary,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginHorizontal: 10,
  },
  mutedBanner: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    elevation: 1,
  },
  mutedText: {
    fontSize: 12,
    color: Colors.text.primary,
    fontWeight: '500',
  },
});

