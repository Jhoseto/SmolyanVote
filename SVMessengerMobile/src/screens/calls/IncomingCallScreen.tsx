/**
 * Incoming Call Screen - WORLD-CLASS PREMIUM VERSION
 * Световен стандарт с 3D ефекти, ring waves, glossy buttons
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
import { TelephoneIcon, XMarkIcon } from '../../components/common/Icons';
import { Colors, Typography, Spacing } from '../../theme';
import { useCalls } from '../../hooks/useCalls';

const { width } = Dimensions.get('window');

export const IncomingCallScreen: React.FC = () => {
  const { currentCall, answerCall, rejectCall } = useCalls();
  
  // Анимации
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ring1Anim = useRef(new Animated.Value(0)).current;
  const ring2Anim = useRef(new Animated.Value(0)).current;
  const ring3Anim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const acceptScaleAnim = useRef(new Animated.Value(1)).current;
  const rejectScaleAnim = useRef(new Animated.Value(1)).current;
  const acceptGlowAnim = useRef(new Animated.Value(0)).current;
  const rejectGlowAnim = useRef(new Animated.Value(0)).current;

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

    // Pulse avatar
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    // Ring waves
    const ring1 = Animated.loop(
      Animated.sequence([
        Animated.timing(ring1Anim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(ring1Anim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ])
    );

    const ring2 = Animated.loop(
      Animated.sequence([
        Animated.delay(300),
        Animated.timing(ring2Anim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(ring2Anim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ])
    );

    const ring3 = Animated.loop(
      Animated.sequence([
        Animated.delay(600),
        Animated.timing(ring3Anim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(ring3Anim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ])
    );

    // Button glows
    const acceptGlow = Animated.loop(
      Animated.sequence([
        Animated.timing(acceptGlowAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: false,
        }),
        Animated.timing(acceptGlowAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: false,
        }),
      ])
    );

    const rejectGlow = Animated.loop(
      Animated.sequence([
        Animated.delay(600),
        Animated.timing(rejectGlowAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: false,
        }),
        Animated.timing(rejectGlowAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: false,
        }),
      ])
    );

    ring1.start();
    ring2.start();
    ring3.start();
    acceptGlow.start();
    rejectGlow.start();

    return () => {
      pulse.stop();
      ring1.stop();
      ring2.stop();
      ring3.stop();
      acceptGlow.stop();
      rejectGlow.stop();
    };
  }, []);

  const handleAcceptPress = () => {
    Animated.sequence([
      Animated.timing(acceptScaleAnim, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(acceptScaleAnim, {
        toValue: 1,
        tension: 400,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start(() => answerCall());
  };

  const handleRejectPress = () => {
    Animated.sequence([
      Animated.timing(rejectScaleAnim, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(rejectScaleAnim, {
        toValue: 1,
        tension: 400,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start(() => rejectCall());
  };

  if (!currentCall) return null;

  const ring1Scale = ring1Anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] });
  const ring1Opacity = ring1Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.7, 0.35, 0] });

  const ring2Scale = ring2Anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] });
  const ring2Opacity = ring2Anim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.5, 0.25, 0] });

  const ring3Scale = ring3Anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.9] });
  const ring3Opacity = ring3Anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.4, 0.15, 0] });

  const acceptGlowOpacity = acceptGlowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] });
  const acceptGlowScale = acceptGlowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });

  const rejectGlowOpacity = rejectGlowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] });
  const rejectGlowScale = rejectGlowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });

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
          {/* Avatar с premium ring waves */}
          <View style={styles.avatarContainer}>
            {/* Ring wave 3 - Premium green gradient */}
            <Animated.View
              style={[
                styles.ringWave,
                {
                  transform: [{ scale: ring3Scale }],
                  opacity: ring3Opacity,
                  backgroundColor: '#15803d', // Darker green for white background
                },
              ]}
            />
            {/* Ring wave 2 - Premium green gradient */}
            <Animated.View
              style={[
                styles.ringWave,
                {
                  transform: [{ scale: ring2Scale }],
                  opacity: ring2Opacity,
                  backgroundColor: '#16a34a', // Medium green
                },
              ]}
            />
            {/* Ring wave 1 - Premium green gradient */}
            <Animated.View
              style={[
                styles.ringWave,
                {
                  transform: [{ scale: ring1Scale }],
                  opacity: ring1Opacity,
                  backgroundColor: '#22c55e', // Primary green
                },
              ]}
            />
            
            {/* Avatar with premium rings */}
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <View style={styles.avatarRing1} />
              <View style={styles.avatarRing2} />
              <Avatar
                imageUrl={currentCall.participantImageUrl}
                name={currentCall.participantName}
                size={150}
                isOnline={true}
                style={styles.avatar}
              />
            </Animated.View>
          </View>

          {/* Caller info */}
          <View style={styles.callerInfo}>
            <Text style={styles.callerName}>{currentCall.participantName}</Text>
            <View style={styles.callingCard}>
              <View style={styles.pulsingDot} />
              <Text style={styles.callingText}>Входящо обаждане...</Text>
            </View>
          </View>

          {/* Premium 3D Action buttons */}
          <View style={styles.actionsContainer}>
            {/* Accept button with 3D effect - зелена слушалка отляво */}
            <TouchableOpacity onPress={handleAcceptPress} activeOpacity={0.9}>
              <Animated.View style={{ transform: [{ scale: acceptScaleAnim }] }}>
                {/* Glow layer */}
                <Animated.View
                  style={[
                    styles.buttonGlow,
                    {
                      backgroundColor: '#22c55e',
                      opacity: acceptGlowOpacity,
                      transform: [{ scale: acceptGlowScale }],
                    },
                  ]}
                />

                {/* Shadow ring */}
                <View style={[styles.buttonShadow, { backgroundColor: '#16a34a' }]} />

                {/* Middle ring */}
                <View style={[styles.buttonMiddle, { backgroundColor: '#4ade80' }]} />

                {/* Inner button */}
                <View style={[styles.buttonInner, { backgroundColor: '#22c55e' }]}>
                  <View style={styles.buttonGloss} />
                  <View style={styles.buttonIconContainer}>
                    <TelephoneIcon size={28} color="#fff" />
                  </View>
                  <View style={styles.buttonDepth} />
                </View>

                <Text style={styles.actionLabel}>Приеми</Text>
              </Animated.View>
            </TouchableOpacity>

            {/* Reject button with 3D effect - червена слушалка отдясно */}
            <TouchableOpacity onPress={handleRejectPress} activeOpacity={0.9}>
              <Animated.View style={{ transform: [{ scale: rejectScaleAnim }] }}>
                {/* Glow layer */}
                <Animated.View
                  style={[
                    styles.buttonGlow,
                    {
                      backgroundColor: '#ef4444',
                      opacity: rejectGlowOpacity,
                      transform: [{ scale: rejectGlowScale }],
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
                    <XMarkIcon size={28} color="#fff" />
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
  ringWave: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
  },
  avatarRing1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.4)', // Premium green
    top: -15,
    left: -15,
  },
  avatarRing2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)', // Premium green
    top: -25,
    left: -25,
  },
  avatar: {
    borderWidth: 6,
    borderColor: '#22c55e', // Premium green border
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 28,
    elevation: 16,
  },
  callerInfo: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  callerName: {
    fontSize: 36,
    fontWeight: '300', // Premium thin font weight for elegant look
    color: '#111827', // Dark text on white background
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 0.5, // Premium letter spacing for elegant typography
    textShadowColor: 'rgba(0, 0, 0, 0.05)',
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
    backgroundColor: '#22c55e', // Premium green
    marginRight: 12,
  },
  callingText: {
    fontSize: 17,
    color: '#15803d', // Dark green text
    fontWeight: '700',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 60,
    paddingHorizontal: 24,
  },
  buttonGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    top: -6,
    left: -6,
  },
  buttonShadow: {
    width: 68,
    height: 68,
    borderRadius: 34,
    position: 'absolute',
    top: 3,
    left: 3,
  },
  buttonMiddle: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  buttonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    position: 'absolute',
    top: 2,
    left: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },
  buttonGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
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
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  actionLabel: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
