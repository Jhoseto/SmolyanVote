import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing, Modal, TouchableWithoutFeedback, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { Avatar } from '../common';
import { ArrowLeftIcon, TelephoneIcon, EllipsisVerticalIcon, SearchIcon } from '../common/Icons';
import { Colors, Typography, Spacing } from '../../theme';
import { useCalls } from '../../hooks/useCalls';
import { useAuthStore } from '../../store/authStore';

interface ChatHeaderProps {
  participantName: string;
  participantImageUrl?: string;
  participantId: number;
  conversationId: number;
  isOnline?: boolean;
  onBack?: () => void;
  onSearchPress?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  participantName,
  participantImageUrl,
  participantId,
  conversationId,
  isOnline = false,
  onBack,
  onSearchPress,
}) => {
  const { startCall } = useCalls();
  const { user } = useAuthStore();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [isMenuVisible, setIsMenuVisible] = useState(false);

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
    if (!user) return;
    startCall(participantId, participantName, participantImageUrl, false, conversationId);
  };

  const toggleMenu = () => setIsMenuVisible(!isMenuVisible);
  const closeMenu = () => setIsMenuVisible(false);

  const handleSearch = () => {
    closeMenu();
    if (onSearchPress) onSearchPress();
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.gradientWrapper}>
        <LinearGradient
          colors={[Colors.green[500], Colors.green[600], Colors.green[700], Colors.green[800]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          <View style={styles.container}>
            {/* Back Button */}
            {onBack && (
              <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
                <ArrowLeftIcon size={24} color={Colors.text.inverse} />
              </TouchableOpacity>
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
              <TouchableOpacity
                onPress={handleVoiceCall}
                style={styles.simpleActionButton}
                activeOpacity={0.7}
              >
                <TelephoneIcon size={24} color={Colors.text.inverse} />
              </TouchableOpacity>

              {/* Menu Button (Three Dots) */}
              <TouchableOpacity
                onPress={toggleMenu}
                style={styles.simpleActionButton}
                activeOpacity={0.7}
              >
                <EllipsisVerticalIcon size={24} color={Colors.text.inverse} />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>

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
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.green[500],
    zIndex: 100,
  },
  gradientWrapper: {
    overflow: 'visible', // Visible for shadows; 'hidden' clips header content
    elevation: 4,
    shadowColor: Colors.green[700],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 10,
  },
  gradient: {
    paddingBottom: 8,
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
    color: Colors.text.inverse,
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
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginTop: Platform.OS === 'android' ? 10 : 40, // Adjust based on statubar
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuText: {
    marginLeft: 12,
    fontSize: 15,
    color: Colors.text.primary,
    fontWeight: '500',
  },
});

