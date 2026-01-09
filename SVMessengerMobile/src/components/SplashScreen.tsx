/**
 * SplashScreen Component
 * Премиум splash screen с Lottie анимация като loading overlay
 * Показва се докато се зарежда приложението
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import { Colors } from '../theme';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
  isLoading: boolean; // Дали приложението все още се зарежда
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onFinish,
  isLoading 
}) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const lottieRef = useRef<LottieView>(null);

  useEffect(() => {
    // Стартираме анимацията веднага
    lottieRef.current?.play();
  }, []);

  useEffect(() => {
    // Когато зареждането приключи, fade out и скриваме
    if (!isLoading) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }
  }, [isLoading, fadeAnim, onFinish]);

  // Не показваме нищо ако не се зарежда
  if (!isLoading && fadeAnim._value === 0) {
    return null;
  }

  return (
    <Animated.View 
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
        },
      ]}
      pointerEvents={isLoading ? 'auto' : 'none'}
    >
      <View style={styles.container}>
        <LottieView
          ref={lottieRef}
          source={require('../assets/animations/animation .json')}
          autoPlay
          loop={true}
          style={styles.lottie}
          resizeMode="contain"
          speed={1}
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
  lottie: {
    width: width * 0.9,
    height: width * 0.9, // Квадратно според резолюцията на анимацията (720x720)
    maxWidth: 720,
    maxHeight: 720,
  },
});

