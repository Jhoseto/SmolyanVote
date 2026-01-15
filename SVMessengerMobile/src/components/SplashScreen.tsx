/**
 * SplashScreen Component
 * Премиум splash screen с Lottie анимация
 * Изпълнява се веднъж за точно 3 секунди
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Image } from 'react-native';
import { Colors } from '../theme';

const { width, height } = Dimensions.get('window');

const ANIMATION_DURATION = 3000; // 3 секунди

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish
}) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const startTime = useRef(Date.now());

  useEffect(() => {
    // Стартираме таймера веднага
    startTime.current = Date.now();

    // След точно 3 секунди скриваме анимацията
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, ANIMATION_DURATION);

    return () => clearTimeout(timer);
  }, [fadeAnim, onFinish]);

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
        },
      ]}
      pointerEvents="auto"
    >
      <View style={styles.container}>
        <Image
          source={require('../assets/images/splash_bg.jpg')}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    backgroundColor: Colors.background.primary || '#FFFFFF',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: width,
    height: height,
  },
  image: {
    width: width,
    height: height,
  },
});

