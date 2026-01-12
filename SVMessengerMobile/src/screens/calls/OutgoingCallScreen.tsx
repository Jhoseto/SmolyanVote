/**
 * Outgoing Call Screen - WORLD-CLASS PREMIUM VERSION
 * Световен стандарт с 3D ефекти, ring waves, glossy buttons
 * Същият стил като IncomingCallScreen, но за изходящи обаждания
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../components/common';
import { XMarkIcon } from '../../components/common/Icons';
import { Colors, Typography, Spacing } from '../../theme';
import { useCalls } from '../../hooks/useCalls';

const { width } = Dimensions.get('window');

export const OutgoingCallScreen: React.FC = () => {
  const { currentCall, endCall } = useCalls();
  
  // Анимации
  // CRITICAL FIX: Removed pulse and ring wave animations - they were ugly and distracting
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const endScaleAnim = useRef(new Animated.Value(1)).current;
  const endGlowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in and slide up
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideUpAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Button glow
    const endGlow = Animated.loop(
      Animated.sequence([
        Animated.timing(endGlowAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: false,
        }),
        Animated.timing(endGlowAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: false,
        }),
      ])
    );

    endGlow.start();

    return () => {
      endGlow.stop();
    };
  }, []);

  const handleEndPress = () => {
    Animated.sequence([
      Animated.timing(endScaleAnim, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(endScaleAnim, {
        toValue: 1,
        tension: 400,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start(() => endCall());
  };

  if (!currentCall) return null;

  const endGlowOpacity = endGlowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] });
  const endGlowScale = endGlowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.background}>
        {/* Animated stars background */}
        <View style={styles.star1} />
        <View style={styles.star2} />
        <View style={styles.star3} />

        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}
        >
          {/* Avatar - CRITICAL FIX: Removed ugly pulsing blue circles and pulse animation */}
          <View style={styles.avatarContainer}>
            <Avatar
              imageUrl={currentCall.participantImageUrl}
              name={currentCall.participantName}
              size={150}
              isOnline={true}
              style={styles.avatar}
            />
          </View>

          {/* Participant info */}
          <View style={styles.participantInfo}>
            <Text style={styles.participantName}>{currentCall.participantName}</Text>
            <View style={styles.callingCard}>
              <View style={styles.pulsingDot} />
              <Text style={styles.callingText}>Изходящо обаждане...</Text>
            </View>
          </View>

          {/* Premium 3D Action button */}
          <View style={styles.actionsContainer}>
            {/* End button with 3D effect - червена слушалка */}
            <TouchableOpacity onPress={handleEndPress} activeOpacity={0.9}>
              <Animated.View style={{ transform: [{ scale: endScaleAnim }] }}>
                {/* Glow layer */}
                <Animated.View
                  style={[
                    styles.buttonGlow,
                    {
                      backgroundColor: '#ef4444',
                      opacity: endGlowOpacity,
                      transform: [{ scale: endGlowScale }],
                    },
                  ]}
                />

                {/* Shadow ring */}
                <View style={[styles.buttonShadow, { backgroundColor: '#dc2626' }]} />

                {/* Middle ring */}
                <View style={[styles.buttonMiddle, { backgroundColor: '#f87171' }]} />

                {/* Inner button */}
                <View style={[styles.buttonInner, { backgroundColor: '#ef4444' }]}>
                  <View style={styles.buttonGloss} />
                  <View style={styles.buttonIconContainer}>
                    <XMarkIcon size={36} color="#fff" />
                  </View>
                  <View style={styles.buttonDepth} />
                </View>

                <Text style={styles.actionLabel}>Откажи</Text>
              </Animated.View>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    backgroundColor: '#ffffff', // Premium white background
  },
  star1: {
    position: 'absolute',
    top: 100,
    left: 50,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  star2: {
    position: 'absolute',
    top: 200,
    right: 80,
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  star3: {
    position: 'absolute',
    bottom: 250,
    left: 100,
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  content: {
    flex: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 40,
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 32,
  },
  avatar: {
    // CRITICAL FIX: Removed ugly blue border and excessive shadows
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  participantInfo: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  participantName: {
    fontSize: 42,
    fontWeight: '800',
    color: '#111827', // Dark text on white background
    marginBottom: 20,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  callingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff', // White background
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#E5E7EB', // Light gray border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  pulsingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3b82f6', // Premium blue
    marginRight: 12,
  },
  callingText: {
    fontSize: 17,
    color: '#1e40af', // Dark blue text
    fontWeight: '700',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
  },
  buttonGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    top: -8,
    left: -8,
  },
  buttonShadow: {
    width: 84,
    height: 84,
    borderRadius: 42,
    position: 'absolute',
    top: 4,
    left: 4,
  },
  buttonMiddle: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  buttonInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    position: 'absolute',
    top: 2,
    left: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 16,
  },
  buttonGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  buttonIconContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  buttonDepth: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '35%',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  actionLabel: {
    marginTop: 14,
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
