/**
 * Chat Header Component
 * Premium header с avatar и voice/video бутони
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { Avatar } from '../common';
import { ArrowLeftIcon, TelephoneIcon, CameraVideoIcon, SearchIcon } from '../common/Icons';
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
    startCall(conversationId, participantId, participantName);
  };

  const handleVideoCall = async () => {
    if (!user) return;
    // Start video call with isVideo flag
    startCall(conversationId, participantId, participantName, undefined, undefined, true);
    console.log('📞 Video call initiated - camera will be enabled automatically');
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
            {/* Search Button */}
            {onSearchPress && (
              <TouchableOpacity
                onPress={onSearchPress}
                style={styles.actionButton}
                activeOpacity={0.7}
              >
                <View style={styles.iconButton}>
                  <SearchIcon size={20} color={Colors.text.inverse} />
                </View>
              </TouchableOpacity>
            )}

            {/* Voice Call Button */}
            <TouchableOpacity
              onPress={handleVoiceCall}
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <View style={styles.iconButton}>
                <TelephoneIcon size={20} color={Colors.text.inverse} />
              </View>
            </TouchableOpacity>

            {/* Video Call Button */}
            <TouchableOpacity
              onPress={handleVideoCall}
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <View style={styles.iconButton}>
                <CameraVideoIcon size={20} color={Colors.text.inverse} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.green[500],
  },
  gradientWrapper: {
    overflow: 'hidden',
    elevation: 12,
    shadowColor: Colors.green[700],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
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
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  nameContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse,
    marginBottom: 2,
  },
  onlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.semantic.success,
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
    gap: Spacing.xs,
  },
  actionButton: {
    marginLeft: Spacing.xs,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});

