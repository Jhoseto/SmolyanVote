import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, StyleProp } from 'react-native';

interface FadeInViewProps {
    children: React.ReactNode;
    delay?: number;
    duration?: number;
    style?: StyleProp<ViewStyle>;
    startY?: number; // Starting Y position offset (default 20 for slide up)
}

export const FadeInView: React.FC<FadeInViewProps> = ({
    children,
    delay = 0,
    duration = 500,
    style,
    startY = 20,
}) => {
    const fadeAnim = useRef(new Animated.Value(0)).current; // Opacity 0 -> 1
    const translateY = useRef(new Animated.Value(startY)).current; // TranslateY startY -> 0

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: duration,
                delay: delay,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: duration,
                delay: delay,
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeAnim, translateY, delay, duration]);

    return (
        <Animated.View
            style={[
                style,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: translateY }],
                },
            ]}
        >
            {children}
        </Animated.View>
    );
};
